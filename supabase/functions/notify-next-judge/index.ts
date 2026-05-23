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

  // Find the next pending match with a judge assigned, in round order
  const { data: nextPartida } = await supabase
    .from('partidas')
    .select('id, torneio_id, numero_rodada, posicao_bracket, juiz_id, blade1:perfis!blade1_id(nome_display), blade2:perfis!blade2_id(nome_display)')
    .eq('torneio_id', torneioId)
    .eq('status', 'pendente')
    .not('juiz_id', 'is', null)
    .not('blade1_id', 'is', null)
    .not('blade2_id', 'is', null)
    .order('numero_rodada', { ascending: true })
    .order('posicao_bracket', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!nextPartida?.juiz_id) {
    return new Response(JSON.stringify({ message: 'no next judge' }), { headers: corsHeaders })
  }

  const { data: sub } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('blade_id', nextPartida.juiz_id)
    .maybeSingle()

  if (!sub) {
    return new Response(JSON.stringify({ message: 'no push subscription for judge' }), { headers: corsHeaders })
  }

  const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!
  const vapidEmail   = Deno.env.get('VAPID_EMAIL') ?? 'mailto:admin@labey.app'

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate)

  const b1 = (nextPartida.blade1 as { nome_display?: string } | null)?.nome_display ?? '?'
  const b2 = (nextPartida.blade2 as { nome_display?: string } | null)?.nome_display ?? '?'

  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify({
      title: 'LaBey — Sua proxima partida!',
      body: `Dirija-se a mesa: ${b1} vs ${b2}`,
      url: `/torneios/${torneioId}`,
    }),
  )

  return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
})
