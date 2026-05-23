import { createClient } from 'jsr:@supabase/supabase-js@2'
// @ts-ignore — web-push via esm.sh works in Deno
import webpush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { torneioId } = await req.json() as { torneioId: string }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!
  const vapidEmail   = Deno.env.get('VAPID_EMAIL') ?? 'mailto:admin@labey.app'
  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate)

  // Find the next pending match with players assigned
  const { data: nextPartida } = await supabase
    .from('partidas')
    .select('id, torneio_id, numero_rodada, posicao_bracket, mesa, juiz_id, blade1_id, blade2_id, blade1:perfis!blade1_id(nome_display), blade2:perfis!blade2_id(nome_display)')
    .eq('torneio_id', torneioId)
    .eq('status', 'pendente')
    .not('blade1_id', 'is', null)
    .not('blade2_id', 'is', null)
    .order('numero_rodada', { ascending: true })
    .order('posicao_bracket', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!nextPartida) {
    return new Response(JSON.stringify({ message: 'no next match' }), { headers: corsHeaders })
  }

  const b1Name = (nextPartida.blade1 as { nome_display?: string } | null)?.nome_display ?? '?'
  const b2Name = (nextPartida.blade2 as { nome_display?: string } | null)?.nome_display ?? '?'
  const mesa = nextPartida.mesa ? ` — Mesa ${nextPartida.mesa}` : ''
  const url = `/torneios/${torneioId}`

  // IDs to notify: judge + both players
  const toNotify: { id: string; msg: string }[] = []

  if (nextPartida.juiz_id) {
    toNotify.push({
      id: nextPartida.juiz_id,
      msg: `Você é o juiz da próxima partida: ${b1Name} vs ${b2Name}${mesa}`,
    })
  }
  if (nextPartida.blade1_id) {
    toNotify.push({
      id: nextPartida.blade1_id,
      msg: `Sua próxima partida: você vs ${b2Name}${mesa}. Dirija-se à mesa!`,
    })
  }
  if (nextPartida.blade2_id) {
    toNotify.push({
      id: nextPartida.blade2_id,
      msg: `Sua próxima partida: ${b1Name} vs você${mesa}. Dirija-se à mesa!`,
    })
  }

  const sent: string[] = []
  await Promise.allSettled(toNotify.map(async ({ id, msg }) => {
    const { data: sub } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('blade_id', id)
      .maybeSingle()

    if (!sub) return

    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title: 'LaBey — Próxima partida!', body: msg, url }),
    )
    sent.push(id)
  }))

  return new Response(JSON.stringify({ ok: true, notified: sent.length }), { headers: corsHeaders })
})
