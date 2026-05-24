import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/lib/auth'
import { useTorneio } from '@/hooks/useTorneio'
import { supabase } from '@/lib/supabase'
import { gerarBracketEliminatorio, gerarEstruturaBracketVazia } from '@/lib/algorithms/eliminatorio'
import { gerarRodadaSuica } from '@/lib/algorithms/swiss'
import { distribuirEmGrupos, gerarPartidasGruposComRodadas, calcularClassificacaoGrupo } from '@/lib/algorithms/grupos'
import { gerarPartidasRoundRobin } from '@/lib/algorithms/roundrobin'
import type { Inscricao, Ranking, TorneioJuiz, Perfil } from '@/types'

export default function TorneioAdmin() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { perfil } = useAuth()
  const { torneio, inscricoes, partidas, loading, reload, partidasError } = useTorneio(id!)
  const [pendentes, setPendentes] = useState<Inscricao[]>([])
  const [listaEspera, setListaEspera] = useState<Inscricao[]>([])
  const [allRankings, setAllRankings] = useState<Ranking[]>([])
  const [linkedRankingIds, setLinkedRankingIds] = useState<Set<string>>(new Set())
  const [juizes, setJuizes] = useState<TorneioJuiz[]>([])
  const [juizesGlobais, setJuizesGlobais] = useState<Perfil[]>([])
  const [jSearch, setJSearch] = useState('')
  const [jResults, setJResults] = useState<Perfil[]>([])
  const [msg, setMsg] = useState('')
  const [autoSimulando, setAutoSimulando] = useState(false)
  const autoSimAtivo = useRef(false)

  const loadJuizes = useCallback(async () => {
    const [{ data: tj }, { data: jg }] = await Promise.all([
      supabase.from('torneio_juizes').select('*, perfil:perfis(id, username, nome_display, avatar_url)').eq('torneio_id', id),
      supabase.from('perfis').select('id, username, nome_display, avatar_url').eq('is_juiz', true).order('nome_display'),
    ])
    if (tj) setJuizes(tj as TorneioJuiz[])
    if (jg) setJuizesGlobais(jg as Perfil[])
  }, [id])

  const loadRankings = useCallback(async () => {
    const [{ data: allR }, { data: rt }] = await Promise.all([
      supabase.from('rankings').select('*').order('created_at', { ascending: false }),
      supabase.from('ranking_torneios').select('ranking_id').eq('torneio_id', id),
    ])
    if (allR) setAllRankings(allR)
    if (rt) setLinkedRankingIds(new Set(rt.map((r: { ranking_id: string }) => r.ranking_id)))
  }, [id])

  useEffect(() => {
    if (!id) return
    supabase.from('inscricoes').select('*, perfil:perfis(*)').eq('torneio_id', id).eq('status', 'pendente')
      .then(({ data }) => { if (data) setPendentes(data as Inscricao[]) })
    supabase.from('inscricoes').select('*, perfil:perfis(*)').eq('torneio_id', id).eq('status', 'lista_espera').order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setListaEspera(data as Inscricao[]) })
    loadRankings()
    loadJuizes()
  }, [id, loadRankings, loadJuizes])

  const toggleRanking = async (rankingId: string) => {
    if (linkedRankingIds.has(rankingId)) {
      await supabase.from('ranking_torneios').delete().eq('torneio_id', id).eq('ranking_id', rankingId)
    } else {
      await supabase.from('ranking_torneios').insert({ torneio_id: id, ranking_id: rankingId })
    }
    await loadRankings()
  }

  const searchBladers = async (q: string) => {
    setJSearch(q)
    if (q.length < 2) { setJResults([]); return }
    const { data } = await supabase.from('perfis').select('id, username, nome_display, avatar_url').or(`username.ilike.%${q}%,nome_display.ilike.%${q}%`).limit(6)
    setJResults((data ?? []) as Perfil[])
  }

  const addJuiz = async (bladeId: string, tipo: 'titular' | 'reserva' = 'titular') => {
    const existente = juizes.find(j => j.blade_id === bladeId)
    if (existente) {
      // Troca o tipo se já existir
      await supabase.from('torneio_juizes').update({ tipo }).eq('id', existente.id)
    } else {
      await supabase.from('torneio_juizes').insert({ torneio_id: id, blade_id: bladeId, tipo })
    }
    await loadJuizes()
    setJSearch(''); setJResults([])
  }

  const removeJuiz = async (juizId: string) => {
    await supabase.from('torneio_juizes').delete().eq('id', juizId)
    await loadJuizes()
  }

  const distribuirJuizes = async () => {
    const titulares = juizes.filter(j => j.tipo === 'titular').map(j => j.blade_id)
    const reservas = juizes.filter(j => j.tipo === 'reserva').map(j => j.blade_id)
    if (!titulares.length && !reservas.length) { setMsg('Adicione juízes primeiro.'); return }

    const pendentes = partidas.filter(p => p.status === 'pendente' && p.blade1_id && p.blade2_id)
    if (!pendentes.length) { setMsg('Nenhuma partida pendente para atribuir.'); return }

    let atribuidas = 0
    let conflitos = 0
    await Promise.all(pendentes.map((p, idx) => {
      const jogadores = [p.blade1_id, p.blade2_id]
      // Titulares que não estão jogando nessa partida
      const tDisp = titulares.filter(id => !jogadores.includes(id))
      // Reservas que não estão jogando nessa partida
      const rDisp = reservas.filter(id => !jogadores.includes(id))
      const pool = tDisp.length ? tDisp : rDisp
      if (!pool.length) { conflitos++; return Promise.resolve() }
      atribuidas++
      return supabase.from('partidas').update({ juiz_id: pool[idx % pool.length] }).eq('id', p.id)
    }))

    const partes = [`${atribuidas} partidas com juíz atribuído`]
    if (conflitos > 0) partes.push(`${conflitos} sem juíz disponível (todos estão jogando)`)
    setMsg(partes.join(' · '))
    await reload()
  }

  if (!perfil?.is_admin) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-danger)', fontFamily: 'DM Sans' }}>Acesso negado</div>
  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</div>
  if (!torneio) return <div style={{ padding: 60, textAlign: 'center', fontFamily: 'DM Sans' }}>Torneio não encontrado</div>

  const aprovar = async (inscricaoId: string) => {
    await supabase.from('inscricoes').update({ status: 'aprovado' }).eq('id', inscricaoId)
    setPendentes(p => p.filter(i => i.id !== inscricaoId))
    setMsg('Inscrição aprovada!')
  }

  const rejeitar = async (inscricaoId: string) => {
    await supabase.from('inscricoes').update({ status: 'rejeitado' }).eq('id', inscricaoId)
    setPendentes(p => p.filter(i => i.id !== inscricaoId))
  }

  const promoverDaFila = async (inscricaoId: string) => {
    await supabase.from('inscricoes').update({ status: 'aprovado' }).eq('id', inscricaoId)
    setListaEspera(p => p.filter(i => i.id !== inscricaoId))
    setMsg('Participante promovido da fila de espera!')
  }

  const removerDaFila = async (inscricaoId: string) => {
    await supabase.from('inscricoes').update({ status: 'rejeitado' }).eq('id', inscricaoId)
    setListaEspera(p => p.filter(i => i.id !== inscricaoId))
  }

  const avancarParaFaseEliminatoria = async () => {
    const partidasGrupos = partidas.filter(p => p.fase === 'grupos')
    if (partidasGrupos.length === 0) { setMsg('Nenhuma partida de grupo encontrada.'); return }
    if (!partidasGrupos.every(p => p.status === 'finalizada')) { setMsg('Finalize todas as partidas de grupo primeiro.'); return }

    const elimPartidas = partidas.filter(p => p.fase !== 'grupos')
    const temElimComJogadores = elimPartidas.some(p => p.blade1_id || p.blade2_id)
    if (temElimComJogadores) { setMsg('Fase eliminatoria ja foi gerada.'); return }

    const classificacao = calcularClassificacaoGrupo(partidasGrupos, {
      vitoria: torneio.pontos_vitoria,
      empate: torneio.pontos_empate,
      derrota: torneio.pontos_derrota,
    })

    const porGrupo = new Map<string, { blade_id: string; grupo: string; pontos: number; saldo: number; gp: number }[]>()
    classificacao.forEach(entry => {
      if (!porGrupo.has(entry.grupo)) porGrupo.set(entry.grupo, [])
      porGrupo.get(entry.grupo)!.push(entry)
    })

    const sortedGroups = [...porGrupo.keys()].sort()
    const numGroups = sortedGroups.length

    // Se há bracket pré-gerado vazio, preenche os slots
    if (elimPartidas.length > 0) {
      const updates: PromiseLike<any>[] = []
      sortedGroups.forEach((grupo, gi) => {
        const membros = (porGrupo.get(grupo) ?? [])
          .sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.gp - a.gp)
        if (membros.length < 2) return
        const [winner, runner] = [membros[0].blade_id, membros[1].blade_id]
        const wm = elimPartidas.find(p => p.numero_rodada === 1 && p.posicao_bracket === gi)
        const rm = elimPartidas.find(p => p.numero_rodada === 1 && p.posicao_bracket === numGroups - 1 - gi)
        if (wm) updates.push(supabase.from('partidas').update({ blade1_id: winner }).eq('id', wm.id).then())
        if (rm) updates.push(supabase.from('partidas').update({ blade2_id: runner }).eq('id', rm.id).then())
      })
      if (updates.length > 0) await Promise.all(updates)
      await reload()
      setMsg(`Classificados distribuídos no bracket! ${numGroups * torneio.classificados_por_grupo} jogadores avançaram.`)
      return
    }

    // Fallback: gera bracket novo (torneios sem pré-geração)
    const classificados: string[] = []
    sortedGroups.forEach(grupo => {
      (porGrupo.get(grupo) ?? [])
        .sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.gp - a.gp)
        .slice(0, torneio.classificados_por_grupo)
        .forEach(m => classificados.push(m.blade_id))
    })
    if (classificados.length < 2) { setMsg('Classificados insuficientes para gerar bracket.'); return }
    const { error: elimErr } = await supabase.from('partidas').insert(gerarBracketEliminatorio(classificados, id!))
    if (elimErr) { setMsg(`Erro ao inserir partidas: ${elimErr.message}`); return }
    await reload()
    setMsg(`Fase eliminatoria gerada com ${classificados.length} classificados!`)
  }

  const gerarProximaRodadaSuica = async () => {
    // Se não há partidas ainda (torneio ficou em_andamento sem gerar 1ª rodada), gera a rodada 1
    if (!partidas.length) {
      if (inscricoes.length < 2) { setMsg('Mínimo 2 participantes aprovados.'); return }
      const novasPartidas = gerarRodadaSuica(
        inscricoes.map(i => ({ id: i.blade_id, pontos: 0, adversarios: [] })), 1, id!
      )
      if (!novasPartidas.length) { setMsg('Não foi possível gerar pares para a rodada 1.'); return }
      const { error } = await supabase.from('partidas').insert(novasPartidas)
      if (error) { setMsg(`Erro ao inserir partidas: ${error.message}`); return }
      await reload()
      setMsg(`Rodada 1 gerada com ${novasPartidas.length} partidas!`)
      return
    }

    const rodadaAtual = Math.max(...partidas.map(p => p.numero_rodada || 0))
    const partidasRodada = partidas.filter(p => p.numero_rodada === rodadaAtual)
    if (!partidasRodada.every(p => p.status === 'finalizada')) {
      setMsg('Finalize todas as partidas da rodada atual antes de gerar a próxima.')
      return
    }

    const pontosMap: Record<string, number> = {}
    const adversariosMap: Record<string, string[]> = {}
    inscricoes.forEach(i => { pontosMap[i.blade_id] = 0; adversariosMap[i.blade_id] = [] })

    partidas.forEach(p => {
      if (p.status !== 'finalizada' || !p.blade1_id || !p.blade2_id) return
      if (!adversariosMap[p.blade1_id]) adversariosMap[p.blade1_id] = []
      if (!adversariosMap[p.blade2_id]) adversariosMap[p.blade2_id] = []
      adversariosMap[p.blade1_id].push(p.blade2_id)
      adversariosMap[p.blade2_id].push(p.blade1_id)
      if (p.vencedor_id) pontosMap[p.vencedor_id] = (pontosMap[p.vencedor_id] || 0) + (torneio.pontos_vitoria || 1)
    })

    const participantes = inscricoes.map(i => ({
      id: i.blade_id,
      pontos: pontosMap[i.blade_id] || 0,
      adversarios: adversariosMap[i.blade_id] || [],
    }))

    const novasPartidas = gerarRodadaSuica(participantes, rodadaAtual + 1, id!)
    if (novasPartidas.length > 0) {
      const { error } = await supabase.from('partidas').insert(novasPartidas)
      if (error) { setMsg(`Erro ao inserir partidas: ${error.message}`); return }
      await reload()
      setMsg(`Rodada ${rodadaAtual + 1} gerada com ${novasPartidas.length} partidas!`)
    } else {
      setMsg('Nao foi possivel gerar novos pares (todos ja jogaram entre si?).')
    }
  }

  const autoSeed = async () => {
    const { data: rt } = await supabase.from('ranking_torneios').select('ranking_id').eq('torneio_id', id).limit(1).maybeSingle()
    if (!rt) { setMsg('Vincule um ranking primeiro para usar auto-seed.'); return }
    const { data: entradas } = await supabase.from('ranking_entradas').select('blade_id, posicao').eq('ranking_id', rt.ranking_id).order('posicao', { ascending: true })
    if (!entradas?.length) { setMsg('Ranking sem entradas.'); return }
    const posMap: Record<string, number> = Object.fromEntries(entradas.map(e => [e.blade_id, e.posicao]))
    await Promise.all(inscricoes.map(ins => supabase.from('inscricoes').update({ seed: posMap[ins.blade_id] ?? 9999 }).eq('id', ins.id)))
    setMsg('Seeds atribuidos pelo ranking!')
  }

  const gerarPartidas = async () => {
    const inscricoesSorted = [...inscricoes].sort((a, b) => (a.seed ?? 9999) - (b.seed ?? 9999))
    const ids = inscricoesSorted.map(i => i.blade_id)
    if (ids.length < 2) { setMsg('Mínimo 2 participantes aprovados.'); return }
    let geradas: any[] = []
    const fmt = torneio.formato
    if (fmt === 'eliminatorio_simples' || fmt === 'eliminatorio_duplo') {
      geradas = gerarBracketEliminatorio(ids, id!)
    } else if (fmt === 'suico') {
      geradas = gerarRodadaSuica(ids.map(pid => ({ id: pid, pontos: 0, adversarios: [] })), 1, id!) as any[]
    } else if (fmt === 'fase_grupos' || fmt === 'copa_do_mundo') {
      // Enforce max 4 players per group
      const numGrupos = Math.max(torneio.num_grupos, Math.ceil(ids.length / 4))
      const numRodadas = Math.min(4, Math.max(1, torneio.num_rodadas_grupo ?? 3))
      const insComGrupo = distribuirEmGrupos(inscricoes, numGrupos)
      await Promise.all(insComGrupo.map(i => supabase.from('inscricoes').update({ grupo: i.grupo }).eq('id', i.id)))
      geradas = gerarPartidasGruposComRodadas(insComGrupo, id!, numRodadas) as any[]
      if (fmt === 'copa_do_mundo') {
        // Pre-generate empty elimination bracket structure
        const numClassificados = numGrupos * (torneio.classificados_por_grupo ?? 2)
        const elimVazia = gerarEstruturaBracketVazia(numClassificados, id!)
        geradas = [...geradas, ...elimVazia]
      }
    } else if (fmt === 'round_robin') {
      geradas = gerarPartidasRoundRobin(ids, id!) as any[]
    }
    if (geradas.length === 0) { setMsg('Não foi possível gerar partidas. Verifique o número de participantes.'); return }
    const { error: insertErr } = await supabase.from('partidas').insert(geradas)
    if (insertErr) { setMsg(`Erro ao salvar partidas: ${insertErr.message}`); return }
    await supabase.from('torneios').update({ status: 'em_andamento' }).eq('id', id)
    await reload()
    setMsg(`✅ ${geradas.length} partidas geradas! Torneio em andamento.`)
  }

  // ─── Simulação de partidas (teste) ────────────────────────────────────────
  const SCORE_PARES: [number, number][] = [[3,0],[3,1],[3,2],[2,3],[1,3],[0,3]]

  const simularLote = async (lote: Array<{ id: string; blade1_id?: string | null; blade2_id?: string | null; torneio_id?: string; numero_rodada?: number | null; posicao_bracket?: number | null }>) => {
    const CHUNK = 6  // max concurrent requests — evita saturar pool do Supabase
    for (let i = 0; i < lote.length; i += CHUNK) {
      await Promise.all(lote.slice(i, i + CHUNK).map(async p => {
        const [s1, s2] = SCORE_PARES[Math.floor(Math.random() * SCORE_PARES.length)]
        const vencedor = s1 > s2 ? p.blade1_id : p.blade2_id
        await supabase.from('partidas').update({ status: 'finalizada', vencedor_id: vencedor, blade1_score: s1, blade2_score: s2 }).eq('id', p.id)
        // Advance winner to next bracket round (eliminatório)
        // Note: server trigger trg_propagate_bracket also does this automatically
        if (vencedor && p.numero_rodada != null && p.posicao_bracket != null) {
          const nextRodada = p.numero_rodada + 1
          const nextPos = Math.floor(p.posicao_bracket / 2)
          const slot = p.posicao_bracket % 2 === 0 ? 'blade1_id' : 'blade2_id'
          const { error: propErr } = await supabase.from('partidas')
            .update({ [slot]: vencedor })
            .eq('torneio_id', p.torneio_id ?? id!)
            .eq('numero_rodada', nextRodada)
            .eq('posicao_bracket', nextPos)
          if (propErr) console.error('[simularLote] propagação bracket:', propErr.message)
        }
      }))
      if (i + CHUNK < lote.length) await new Promise(r => setTimeout(r, 150))
    }
  }

  const simularRodada = async () => {
    const pendentes = partidas.filter(p => p.status === 'pendente' && p.blade1_id && p.blade2_id)
    if (!pendentes.length) { setMsg('Nenhuma partida pendente para simular.'); return }
    const minRodada = Math.min(...pendentes.map(p => p.numero_rodada ?? 0))
    const lote = pendentes.filter(p => (p.numero_rodada ?? 0) === minRodada)
    await simularLote(lote)
    await reload()
    setMsg(`▶ Rodada ${minRodada || ''} simulada (${lote.length} partida${lote.length !== 1 ? 's' : ''})`)
  }

  const simularTudo = async () => {
    if (torneio.formato === 'suico') {
      // Swiss: gera + simula todas as rodadas em loop
      let todasPartidas = [...partidas]
      let rodadaAtual = todasPartidas.length ? Math.max(...todasPartidas.map(p => p.numero_rodada || 0)) : 0
      let totalSimuladas = 0

      // Simula pendentes existentes primeiro
      let pendentes = todasPartidas.filter(p => p.status === 'pendente' && p.blade1_id && p.blade2_id)

      while (pendentes.length > 0 || rodadaAtual < torneio.num_rodadas_suico) {
        if (pendentes.length > 0) {
          await simularLote(pendentes)
          totalSimuladas += pendentes.length
          // Marca como finalizadas no array local
          pendentes.forEach(p => {
            const idx = todasPartidas.findIndex(x => x.id === p.id)
            if (idx >= 0) todasPartidas[idx] = { ...todasPartidas[idx], status: 'finalizada' }
          })
          rodadaAtual = Math.max(rodadaAtual, ...pendentes.map(p => p.numero_rodada || 0))
        }

        if (rodadaAtual >= torneio.num_rodadas_suico) break

        // Calcula pontos e adversários para a próxima rodada
        const pontosMap: Record<string, number> = {}
        const adversariosMap: Record<string, string[]> = {}
        inscricoes.forEach(i => { pontosMap[i.blade_id] = 0; adversariosMap[i.blade_id] = [] })
        todasPartidas.forEach(p => {
          if (p.status !== 'finalizada' || !p.blade1_id || !p.blade2_id) return
          adversariosMap[p.blade1_id] = [...(adversariosMap[p.blade1_id] || []), p.blade2_id]
          adversariosMap[p.blade2_id] = [...(adversariosMap[p.blade2_id] || []), p.blade1_id]
          if (p.vencedor_id) pontosMap[p.vencedor_id] = (pontosMap[p.vencedor_id] || 0) + (torneio.pontos_vitoria || 1)
        })

        const participantes = inscricoes.map(i => ({
          id: i.blade_id,
          pontos: pontosMap[i.blade_id] || 0,
          adversarios: adversariosMap[i.blade_id] || [],
        }))

        const novasPartidas = gerarRodadaSuica(participantes, rodadaAtual + 1, id!)
        if (!novasPartidas.length) break

        const { error } = await supabase.from('partidas').insert(novasPartidas)
        if (error) { setMsg(`Erro gerando rodada ${rodadaAtual + 1}: ${error.message}`); return }
        const novasComStatus = novasPartidas.map(p => ({ ...p, status: 'pendente' as const })) as typeof partidas
        todasPartidas = [...todasPartidas, ...novasComStatus]
        pendentes = novasComStatus.filter(p => p.blade1_id && p.blade2_id)
      }

      await reload()
      setMsg(`⏭ Torneio suíço completo! ${totalSimuladas} partidas em ${rodadaAtual} rodadas.`)
    } else {
      const pendentes = partidas.filter(p => p.status === 'pendente' && p.blade1_id && p.blade2_id)
      if (!pendentes.length) { setMsg('Nenhuma partida pendente para simular.'); return }
      // Grupos: simula um grupo por vez para não sobrecarregar (ex: 900 partidas)
      const gruposPend = pendentes.filter(p => (p as any).fase === 'grupos')
      if (gruposPend.length > 0) {
        const sortedGrupos = [...new Set(gruposPend.map((p: any) => p.grupo))].filter(Boolean).sort() as string[]
        let total = 0
        for (const g of sortedGrupos) {
          const lote = gruposPend.filter((p: any) => p.grupo === g)
          await simularLote(lote)
          total += lote.length
        }
        await reload()
        setMsg(`⏭ ${total} partidas de grupo simuladas!`)
      } else {
        await simularLote(pendentes)
        await reload()
        setMsg(`⏭ ${pendentes.length} partidas simuladas!`)
      }
    }
  }
  const pararAutoSimular = () => {
    autoSimAtivo.current = false
    setAutoSimulando(false)
    setMsg('Auto-simulação pausada.')
  }

  const runAutoSimStep = async () => {
    if (!autoSimAtivo.current) return

    try {

    // Busca TODAS as partidas frescas do banco (incluindo fase e dados de grupo para copa_do_mundo)
    const { data: ps, error: fetchErr } = await supabase
      .from('partidas')
      .select('id, blade1_id, blade2_id, status, numero_rodada, posicao_bracket, torneio_id, fase, grupo, vencedor_id, blade1_score, blade2_score')
      .eq('torneio_id', id)

    if (fetchErr) {
      console.error('[autoSim] erro ao buscar partidas:', fetchErr)
      setMsg(`⚠️ Erro ao buscar partidas: ${fetchErr.message} — tentando em 5s...`)
      if (autoSimAtivo.current) setTimeout(runAutoSimStep, 5000)
      return
    }

    const todas = (ps ?? []) as any[]

    // Copa do Mundo: avança top 2 de cada grupo completo para o bracket pré-gerado
    if (torneio?.formato === 'copa_do_mundo') {
      const gruposPs = todas.filter((p: any) => p.fase === 'grupos')
      const elimPs   = todas.filter((p: any) => p.fase !== 'grupos')

      // Fallback: se não há bracket pré-gerado e todos os grupos terminaram, gera agora
      if (gruposPs.length > 0 && gruposPs.every((p: any) => p.status === 'finalizada') && elimPs.length === 0) {
        setMsg('🔄 Todos os grupos finalizados! Gerando fase eliminatória...')
        const classificacao = calcularClassificacaoGrupo(gruposPs, {
          vitoria: torneio.pontos_vitoria, empate: torneio.pontos_empate, derrota: torneio.pontos_derrota,
        })
        const porGrupo = new Map<string, { blade_id: string; pontos: number; saldo: number; gp: number }[]>()
        classificacao.forEach(entry => {
          if (!porGrupo.has(entry.grupo)) porGrupo.set(entry.grupo, [])
          porGrupo.get(entry.grupo)!.push(entry)
        })
        const classificados: string[] = []
        porGrupo.forEach(membros => {
          membros.sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.gp - a.gp)
            .slice(0, torneio.classificados_por_grupo).forEach(m => classificados.push(m.blade_id))
        })
        if (classificados.length >= 2) {
          const { error } = await supabase.from('partidas').insert(gerarBracketEliminatorio(classificados, id!))
          if (error) { setMsg(`Erro: ${error.message}`); autoSimAtivo.current = false; setAutoSimulando(false); return }
          await reload()
          setMsg(`✅ Fase eliminatória gerada! Continuando em 5s...`)
          if (autoSimAtivo.current) setTimeout(runAutoSimStep, 5000)
        } else { autoSimAtivo.current = false; setAutoSimulando(false) }
        return
      }

      // Novo: avança top 2 de cada grupo completo para slots do bracket pré-gerado
      if (elimPs.length > 0) {
        const sortedGroups = [...new Set(gruposPs.map((p: any) => p.grupo).filter(Boolean))].sort() as string[]
        const numGroups = sortedGroups.length
        const updates: PromiseLike<any>[] = []
        for (let gi = 0; gi < sortedGroups.length; gi++) {
          const grupo = sortedGroups[gi]
          const grupoPs = gruposPs.filter((p: any) => p.grupo === grupo)
          if (!grupoPs.every((p: any) => p.status === 'finalizada')) continue
          const classificacao = calcularClassificacaoGrupo(grupoPs, {
            vitoria: torneio.pontos_vitoria, empate: torneio.pontos_empate, derrota: torneio.pontos_derrota,
          })
          const top = [...classificacao.values()].filter(c => c.grupo === grupo)
            .sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.gp - a.gp)
          if (top.length < 2) continue
          const [winner, runner] = [top[0].blade_id, top[1].blade_id]
          // Cross-seeding: group i winner → match i blade1, group i runner-up → match (N-1-i) blade2
          const winnerMatch = elimPs.find((p: any) => p.numero_rodada === 1 && p.posicao_bracket === gi)
          const runnerMatch = elimPs.find((p: any) => p.numero_rodada === 1 && p.posicao_bracket === numGroups - 1 - gi)
          if (winnerMatch && !winnerMatch.blade1_id)
            updates.push(supabase.from('partidas').update({ blade1_id: winner }).eq('id', winnerMatch.id).then())
          if (runnerMatch && !runnerMatch.blade2_id)
            updates.push(supabase.from('partidas').update({ blade2_id: runner }).eq('id', runnerMatch.id).then())
        }
        if (updates.length > 0) {
          await Promise.all(updates)
          await reload()
          // Return so the next call fetches fresh data with populated bracket slots.
          // Using stale 'todas' here would show pendentes=0 and finalize the tournament prematurely.
          if (autoSimAtivo.current) setTimeout(runAutoSimStep, 2000)
          return
        }
      }
    }

    // Suíço: quando toda a rodada atual está concluída, gerar a próxima automaticamente
    if (torneio?.formato === 'suico' && todas.length > 0) {
      const rodadaAtual = Math.max(...todas.map((p: any) => p.numero_rodada ?? 0))
      const matchesDaRodada = todas.filter((p: any) => (p.numero_rodada ?? 0) === rodadaAtual)
      const rodadaConcluida = matchesDaRodada.length > 0 && matchesDaRodada.every((p: any) => p.status === 'finalizada')
      const proximaExiste = todas.some((p: any) => (p.numero_rodada ?? 0) > rodadaAtual)

      if (rodadaConcluida && !proximaExiste && rodadaAtual < (torneio.num_rodadas_suico ?? 0)) {
        setMsg(`🔄 Rodada ${rodadaAtual} concluída! Gerando rodada ${rodadaAtual + 1}/${torneio.num_rodadas_suico}...`)

        const pontosMap: Record<string, number> = {}
        const adversariosMap: Record<string, string[]> = {}
        const allPlayerIds = [...new Set([
          ...todas.filter((p: any) => p.blade1_id).map((p: any) => p.blade1_id as string),
          ...todas.filter((p: any) => p.blade2_id).map((p: any) => p.blade2_id as string),
        ])]
        allPlayerIds.forEach(pid => { pontosMap[pid] = 0; adversariosMap[pid] = [] })
        todas.forEach((p: any) => {
          if (p.status !== 'finalizada' || !p.blade1_id || !p.blade2_id) return
          adversariosMap[p.blade1_id].push(p.blade2_id)
          adversariosMap[p.blade2_id].push(p.blade1_id)
          if (p.vencedor_id) pontosMap[p.vencedor_id] = (pontosMap[p.vencedor_id] || 0) + (torneio.pontos_vitoria || 1)
        })
        const participantes = allPlayerIds.map(pid => ({
          id: pid, pontos: pontosMap[pid] || 0, adversarios: adversariosMap[pid] || [],
        }))

        const novasPartidas = gerarRodadaSuica(participantes, rodadaAtual + 1, id!)
        const { error: suicoErr } = await supabase.from('partidas').insert(novasPartidas)
        if (suicoErr) {
          setMsg(`Erro ao gerar rodada ${rodadaAtual + 1}: ${suicoErr.message}`)
          autoSimAtivo.current = false; setAutoSimulando(false); return
        }
        await reload()
        setMsg(`✅ Rodada ${rodadaAtual + 1}/${torneio.num_rodadas_suico} gerada! Simulando em 3s...`)
        if (autoSimAtivo.current) setTimeout(runAutoSimStep, 3000)
        return
      }
    }

    // Auto-advance bye matches in elimination brackets (one real player, null opponent)
    // Happens when number of advancing players is not a power of 2 (e.g. 50 players → 64-slot bracket)
    {
      const isElimFase = (f: any) => ['semi','final','quartas','oitavas','decasseis'].includes(f) || (typeof f === 'string' && f.startsWith('rodada_'))
      const byeMatches = todas.filter((p: any) =>
        p.status === 'pendente' && p.numero_rodada != null && isElimFase(p.fase) &&
        ((p.blade1_id && !p.blade2_id) || (!p.blade1_id && p.blade2_id))
      )
      if (byeMatches.length > 0) {
        await Promise.all(byeMatches.map(async (bye: any) => {
          const winner = bye.blade1_id ?? bye.blade2_id
          await supabase.from('partidas').update({
            status: 'finalizada', vencedor_id: winner,
            blade1_score: bye.blade1_id ? 1 : 0,
            blade2_score: bye.blade2_id ? 1 : 0,
          }).eq('id', bye.id)
        }))
        setMsg(`▶ Auto: ${byeMatches.length} bye${byeMatches.length > 1 ? 's' : ''} avançado${byeMatches.length > 1 ? 's' : ''} automaticamente`)
        await reload()
        if (autoSimAtivo.current) setTimeout(runAutoSimStep, 1000)
        return
      }
    }

    const pendentes = todas.filter((p: any) => p.status === 'pendente' && p.blade1_id && p.blade2_id)

    // Usuário pausou
    if (!autoSimAtivo.current) { setAutoSimulando(false); return }

    // Sem mais partidas pendentes → finalizar torneio
    if (!pendentes.length) {
      autoSimAtivo.current = false
      setAutoSimulando(false)

      const comJogadores = todas.filter((p: any) => p.blade1_id && p.blade2_id)
      const todasFinalizadas = comJogadores.length > 0 && comJogadores.every((p: any) => p.status === 'finalizada')

      if (todasFinalizadas) {
        await supabase.from('torneios').update({ status: 'finalizado' }).eq('id', id!)

        const fmt = torneio?.formato
        let vencedorId: string | null = null

        if (fmt === 'eliminatorio_simples' || fmt === 'eliminatorio_duplo') {
          const maxR = Math.max(...todas.map((p: any) => p.numero_rodada ?? 0))
          vencedorId = todas.find((p: any) => p.numero_rodada === maxR && p.posicao_bracket === 0)?.vencedor_id ?? null
        } else if (fmt === 'copa_do_mundo') {
          const elimPs = todas.filter((p: any) => p.fase !== 'grupos')
          if (elimPs.length > 0) {
            const maxR = Math.max(...elimPs.map((p: any) => p.numero_rodada ?? 0))
            vencedorId = elimPs.find((p: any) => p.numero_rodada === maxR && p.posicao_bracket === 0)?.vencedor_id ?? null
          }
        } else {
          const winsMap: Record<string, number> = {}
          todas.forEach((p: any) => { if (p.vencedor_id) winsMap[p.vencedor_id] = (winsMap[p.vencedor_id] ?? 0) + 1 })
          vencedorId = Object.entries(winsMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
        }

        if (vencedorId) {
          const { data: pf } = await supabase.from('perfis').select('username, nome_display').eq('id', vencedorId).single()
          const nome = pf?.nome_display ?? pf?.username ?? vencedorId.slice(0, 8)
          setMsg(`🏆 Torneio finalizado! Campeão: ${nome}`)
        } else {
          setMsg('🏆 Torneio finalizado!')
        }
        await reload()
      } else {
        setMsg('Auto-simulação concluída.')
        await reload()
      }
      return
    }

    // Partidas de grupos: simula uma rodada por vez (todos os grupos da mesma rodada juntos)
    const gruposPendentes = pendentes.filter((p: any) => p.fase === 'grupos')
    if (gruposPendentes.length > 0) {
      const minRodadaGrupo = Math.min(...gruposPendentes.map((p: any) => p.numero_rodada ?? 1))
      const lote = gruposPendentes.filter((p: any) => (p.numero_rodada ?? 1) === minRodadaGrupo)
      const gruposNaRodada = [...new Set(lote.map((p: any) => p.grupo))].filter(Boolean).sort()
      await simularLote(lote)
      await reload()
      setMsg(`▶ Auto: Rodada ${minRodadaGrupo} de grupos simulada (${lote.length} partidas · grupos ${gruposNaRodada.join(', ')})`)
      if (!autoSimAtivo.current) return
      const delay = 3000 + Math.random() * 2000
      setTimeout(runAutoSimStep, delay)
      return
    }

    // Eliminatória / round-robin / suíço: simula por rodada
    const minRodada = Math.min(...pendentes.map((p: any) => p.numero_rodada ?? 0))
    const lote = pendentes.filter((p: any) => (p.numero_rodada ?? 0) === minRodada)
    await simularLote(lote)
    await reload()
    setMsg(`▶ Auto: rodada ${minRodada || ''} simulada (${lote.length} partida${lote.length !== 1 ? 's' : ''})`)

    if (!autoSimAtivo.current) return
    const delay = 5000 + Math.random() * 3000
    setTimeout(runAutoSimStep, delay)

    } catch (err) {
      console.error('[autoSim] erro inesperado:', err)
      setMsg(`⚠️ Erro inesperado: ${err instanceof Error ? err.message : String(err)} — tentando em 5s...`)
      if (autoSimAtivo.current) setTimeout(runAutoSimStep, 5000)
    }
  }

  const iniciarAutoSimular = () => {
    autoSimAtivo.current = true
    setAutoSimulando(true)
    runAutoSimStep()
  }

  const repararBracket = async () => {
    const finalizadas = partidas.filter(p =>
      p.status === 'finalizada' && p.vencedor_id && p.numero_rodada != null && p.posicao_bracket != null
    )
    let reparadas = 0
    await Promise.all(finalizadas.map(async p => {
      const nextRodada = p.numero_rodada! + 1
      const nextPos = Math.floor(p.posicao_bracket! / 2)
      const slot = p.posicao_bracket! % 2 === 0 ? 'blade1_id' : 'blade2_id'
      const nextMatch = partidas.find(m => m.numero_rodada === nextRodada && m.posicao_bracket === nextPos)
      if (nextMatch && nextMatch[slot as 'blade1_id' | 'blade2_id'] !== p.vencedor_id) {
        reparadas++
        await supabase.from('partidas')
          .update({ [slot]: p.vencedor_id })
          .eq('torneio_id', id!)
          .eq('numero_rodada', nextRodada)
          .eq('posicao_bracket', nextPos)
      }
    }))
    await reload()
    // Also advance byes: matches where only one player exists (no opponent — phantom bracket slot)
    const { data: freshPs } = await supabase.from('partidas')
      .select('id, blade1_id, blade2_id, fase, numero_rodada')
      .eq('torneio_id', id!)
      .eq('status', 'pendente')
    const isElimFase = (f: any) => ['semi','final','quartas','oitavas','decasseis'].includes(f) || (typeof f === 'string' && f.startsWith('rodada_'))
    const byes = (freshPs ?? []).filter((p: any) =>
      isElimFase(p.fase) && p.numero_rodada != null &&
      ((p.blade1_id && !p.blade2_id) || (!p.blade1_id && p.blade2_id))
    )
    if (byes.length > 0) {
      await Promise.all(byes.map(async (bye: any) => {
        const winner = bye.blade1_id ?? bye.blade2_id
        await supabase.from('partidas').update({
          status: 'finalizada', vencedor_id: winner,
          blade1_score: bye.blade1_id ? 1 : 0,
          blade2_score: bye.blade2_id ? 1 : 0,
        }).eq('id', bye.id)
      }))
      reparadas += byes.length
      await reload()
    }
    setMsg(`🔧 Bracket reparado: ${reparadas} avanço${reparadas !== 1 ? 's' : ''} aplicado${reparadas !== 1 ? 's' : ''}.`)
  }
  // ──────────────────────────────────────────────────────────────────────────

  const atualizarStatus = async (status: string) => {
    await supabase.from('torneios').update({ status }).eq('id', id)
    setMsg(`Status atualizado para: ${status}`)
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 13, padding: '0 0 16px 0' }}>← Voltar</button>
          <Link to={`/torneios/${id}/tv`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(43,91,232,0.12)', border: '1px solid rgba(43,91,232,0.3)', borderRadius: 8, padding: '6px 14px', color: 'var(--color-blue-light)', fontFamily: 'DM Sans', fontSize: 12, textDecoration: 'none', marginBottom: 16 }}>📺 Modo TV</Link>
        </div>
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: '28px', fontWeight: 700, marginBottom: 8 }}>Admin — {torneio.nome}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: '13px', marginBottom: 32 }}>Status: {torneio.status}</p>
        {msg && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--color-success)', borderRadius: 8, padding: '10px 16px', marginBottom: 24, color: 'var(--color-success)', fontFamily: 'DM Sans', fontSize: '13px' }}>{msg}</div>}
        {!loading && torneio.status === 'em_andamento' && partidas.length === 0 && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontFamily: 'DM Sans', fontSize: '13px' }}>
            <div style={{ color: 'var(--color-warning)', fontWeight: 600, marginBottom: 6 }}>⚠️ Torneio em andamento sem partidas detectadas</div>
            {partidasError && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginBottom: 8 }}>Erro Supabase: {partidasError}</div>}
            <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 10 }}>As partidas podem não ter sido salvas, ou houve um erro ao carregá-las. Tente recarregar ou resete o torneio para inscrições para gerar novamente.</div>
            <button onClick={reload} style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)', border: '1px solid rgba(245,158,11,0.4)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 500 }}>↻ Recarregar partidas</button>
          </div>
        )}

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Rajdhani', fontSize: '18px', marginBottom: 16 }}>Ações</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {torneio.status === 'rascunho' && <button onClick={() => atualizarStatus('inscricoes')} className="btn-primary">Abrir inscrições</button>}
            {torneio.status === 'inscricoes' && linkedRankingIds.size > 0 && <button onClick={autoSeed} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500 }}>Seed pelo ranking</button>}
            {torneio.status === 'inscricoes' && <button onClick={gerarPartidas} className="btn-primary">Gerar partidas e iniciar</button>}
            {torneio.status === 'em_andamento' && torneio.formato === 'copa_do_mundo' && (() => {
              const gruposDone = partidas.filter(p => p.fase === 'grupos').every(p => p.status === 'finalizada')
              const temElimComJog = partidas.some(p => p.fase !== 'grupos' && (p.blade1_id || p.blade2_id))
              return gruposDone && !temElimComJog && partidas.some(p => p.fase === 'grupos')
                ? <button onClick={avancarParaFaseEliminatoria} className="btn-primary">Avancar para fase eliminatoria</button>
                : null
            })()}
            {torneio.status === 'em_andamento' && torneio.formato === 'suico' && (() => {
              const rodadaAtual = partidas.length ? Math.max(...partidas.map(p => p.numero_rodada || 0)) : 0
              return rodadaAtual < torneio.num_rodadas_suico
                ? <button onClick={gerarProximaRodadaSuica} className="btn-primary">{rodadaAtual === 0 ? 'Gerar rodada 1' : `Gerar próxima rodada (${rodadaAtual}/${torneio.num_rodadas_suico})`}</button>
                : <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)', padding: '10px 0' }}>Todas as {torneio.num_rodadas_suico} rodadas geradas</span>
            })()}
            {torneio.status === 'em_andamento' && partidas.length === 0 && (
              <button onClick={() => atualizarStatus('inscricoes')} style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)', border: '1px solid rgba(245,158,11,0.4)', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500 }}>⚠️ Resetar para Inscrições</button>
            )}
            {torneio.status === 'em_andamento' && partidas.length > 0 && <button onClick={() => atualizarStatus('finalizado')} style={{ background: 'var(--color-success)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500 }}>Finalizar torneio</button>}
          </div>

          {/* Simulação — só aparece quando em andamento com partidas geradas */}
          {torneio.status === 'em_andamento' && partidas.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
              <p style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>🎲 Simulação de testes</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={simularRodada} disabled={autoSimulando} style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', padding: '8px 18px', borderRadius: 8, cursor: autoSimulando ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, opacity: autoSimulando ? 0.5 : 1 }}>▶ Simular rodada</button>
                <button onClick={simularTudo} disabled={autoSimulando} style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)', padding: '8px 18px', borderRadius: 8, cursor: autoSimulando ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, opacity: autoSimulando ? 0.5 : 1 }}>⏭ Simular tudo</button>
                {autoSimulando
                  ? <button onClick={pararAutoSimular} style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.35)', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13 }}>⏹ Parar auto-sim</button>
                  : <button onClick={iniciarAutoSimular} style={{ background: 'rgba(139,92,246,0.25)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.5)', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13 }}>⏱ Auto-simular (10–15s)</button>
                }
                {(torneio.formato === 'eliminatorio_simples' || torneio.formato === 'eliminatorio_duplo' || torneio.formato === 'copa_do_mundo') && (
                  <button onClick={repararBracket} disabled={autoSimulando} title="Propaga vencedores já registrados para os slots vazios da próxima rodada" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', padding: '8px 18px', borderRadius: 8, cursor: autoSimulando ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, opacity: autoSimulando ? 0.5 : 1 }}>🔧 Reparar bracket</button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Rajdhani', fontSize: '18px', marginBottom: 8 }}>Rankings vinculados</h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 14 }}>Selecione em quais rankings este torneio pontua.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allRankings.map(r => {
              const linked = linkedRankingIds.has(r.id)
              return (
                <button key={r.id} onClick={() => toggleRanking(r.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: linked ? 'rgba(43,91,232,0.12)' : 'var(--color-bg-secondary)', outline: linked ? '1.5px solid rgba(43,91,232,0.4)' : '1.5px solid var(--color-border)', transition: 'all 0.15s', textAlign: 'left' }}>
                  <span style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, color: linked ? 'var(--color-blue-light)' : 'var(--color-text-primary)' }}>🏅 {r.nome}{r.temporada ? ` · ${r.temporada}` : ''}</span>
                  <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: linked ? 'var(--color-blue-light)' : 'var(--color-text-muted)', background: linked ? 'rgba(43,91,232,0.2)' : 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{linked ? '✓ Vinculado' : '+ Vincular'}</span>
                </button>
              )
            })}
            {allRankings.length === 0 && <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)' }}>Nenhum ranking cadastrado.</p>}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Rajdhani', fontSize: '18px', marginBottom: 4 }}>Juízes do torneio</h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Selecione da lista de juízes cadastrados. Um juíz pode participar do torneio — a distribuição automática detecta conflitos e usa reservas quando necessário.
          </p>

          {/* Lista de juízes globais cadastrados */}
          {juizesGlobais.length === 0 ? (
            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-warning)' }}>
              Nenhum juíz cadastrado globalmente. Vá em <strong>Admin → Usuários</strong> e marque bladers como Juíz.
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Juízes disponíveis</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {juizesGlobais.map(jg => {
                  const atribuido = juizes.find(j => j.blade_id === jg.id)
                  const isParticipante = inscricoes.some(i => i.blade_id === jg.id)
                  return (
                    <div key={jg.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: atribuido ? (atribuido.tipo === 'titular' ? 'rgba(43,91,232,0.08)' : 'rgba(245,158,11,0.07)') : 'var(--color-bg-secondary)', border: '1px solid', borderColor: atribuido ? (atribuido.tipo === 'titular' ? 'rgba(43,91,232,0.3)' : 'rgba(245,158,11,0.3)') : 'var(--color-border)' }}>
                      {/* Identidade — ocupa o espaço disponível e nunca transborda */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 140px', minWidth: 0 }}>
                        <span style={{ fontSize: 15, flexShrink: 0 }}>⚖️</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {jg.nome_display}
                            {isParticipante && <span style={{ fontFamily: 'DM Sans', fontSize: 10, marginLeft: 6, background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)', padding: '1px 5px', borderRadius: 8, whiteSpace: 'nowrap' }}>participa</span>}
                          </div>
                          <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{jg.username}</div>
                        </div>
                      </div>
                      {/* Botões — sempre na mesma linha se couber, senão quebra para baixo */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {atribuido ? (
                          <>
                            <button onClick={() => addJuiz(jg.id, atribuido.tipo === 'titular' ? 'reserva' : 'titular')} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, background: atribuido.tipo === 'titular' ? 'rgba(43,91,232,0.2)' : 'rgba(245,158,11,0.2)', color: atribuido.tipo === 'titular' ? 'var(--color-blue-light)' : 'var(--color-warning)' }}>
                              {atribuido.tipo === 'titular' ? '★ Titular' : '◎ Reserva'}
                            </button>
                            <button onClick={() => removeJuiz(atribuido.id)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 11 }}>✕</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => addJuiz(jg.id, 'titular')} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, background: 'rgba(43,91,232,0.12)', color: 'var(--color-blue-light)' }}>+ Titular</button>
                            <button onClick={() => addJuiz(jg.id, 'reserva')} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.07)', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: 'var(--color-warning)' }}>+ Reserva</button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Busca para adicionar juíz avulso (não cadastrado globalmente) */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Adicionar juíz avulso</p>
            <div style={{ position: 'relative' }}>
              <input
                value={jSearch}
                onChange={e => searchBladers(e.target.value)}
                placeholder="Buscar blader pelo nome..."
                style={{ width: '100%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: '13px', boxSizing: 'border-box' }}
              />
              {jResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, zIndex: 10, overflow: 'hidden' }}>
                  {jResults.filter(r => !juizesGlobais.some(jg => jg.id === r.id)).map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ fontFamily: 'DM Sans', fontSize: 13 }}>{p.nome_display} <span style={{ color: 'var(--color-text-muted)' }}>@{p.username}</span></span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => addJuiz(p.id, 'titular')} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: 'rgba(43,91,232,0.15)', color: 'var(--color-blue-light)', fontFamily: 'DM Sans', fontSize: 11, cursor: 'pointer' }}>Titular</button>
                        <button onClick={() => addJuiz(p.id, 'reserva')} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)', fontFamily: 'DM Sans', fontSize: 11, cursor: 'pointer' }}>Reserva</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resumo + Distribuir */}
          {juizes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '10px 14px', background: 'var(--color-bg-secondary)', borderRadius: 8 }}>
              <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>
                <span style={{ color: 'var(--color-blue-light)', fontWeight: 700 }}>{juizes.filter(j => j.tipo === 'titular').length} titulares</span>
                {juizes.filter(j => j.tipo === 'reserva').length > 0 && <span style={{ color: 'var(--color-warning)', fontWeight: 700 }}> · {juizes.filter(j => j.tipo === 'reserva').length} reservas</span>}
              </div>
              <button onClick={distribuirJuizes} className="btn-primary" style={{ fontSize: 12, padding: '8px 18px' }}>⚖️ Distribuir juízes pelas partidas</button>
            </div>
          )}
        </div>

        {pendentes.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'Rajdhani', fontSize: '18px', marginBottom: 16 }}>Inscrições Pendentes ({pendentes.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendentes.map(ins => (
                <div key={ins.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: 8 }}>
                  <span style={{ fontFamily: 'DM Sans', fontSize: '14px' }}>{ins.perfil?.nome_display ?? ins.blade_id}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => aprovar(ins.id)} style={{ background: 'var(--color-success)', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans' }}>Aprovar</button>
                    <button onClick={() => rejeitar(ins.id)} style={{ background: 'var(--color-danger)', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans' }}>Rejeitar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {listaEspera.length > 0 && (
          <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(245,158,11,0.3)' }}>
            <h2 style={{ fontFamily: 'Rajdhani', fontSize: '18px', marginBottom: 4, color: 'var(--color-warning)' }}>Fila de Espera ({listaEspera.length})</h2>
            <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Ordem de chegada. Promova para dar uma vaga direta.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {listaEspera.map((ins, idx) => (
                <div key={ins.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: 'var(--color-warning)', minWidth: 20 }}>#{idx + 1}</span>
                    <span style={{ fontFamily: 'DM Sans', fontSize: '14px' }}>{ins.perfil?.nome_display ?? ins.blade_id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => promoverDaFila(ins.id)} style={{ background: 'var(--color-success)', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans' }}>Promover</button>
                    <button onClick={() => removerDaFila(ins.id)} style={{ background: 'none', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans' }}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontFamily: 'Rajdhani', fontSize: '18px', margin: 0 }}>Participantes Aprovados ({inscricoes.length})</h2>
            <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#22c55e' }}>
              {inscricoes.filter(i => i.checked_in).length}/{inscricoes.length} com check-in
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {inscricoes.map(ins => (
              <div key={ins.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {ins.perfil?.avatar_url && <img src={ins.perfil.avatar_url} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} alt="" />}
                  <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-primary)' }}>{ins.perfil?.nome_display ?? ins.blade_id.slice(0, 8)}</span>
                  {ins.seed && <span style={{ fontFamily: 'DM Sans', fontSize: 10, color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>#{ins.seed}</span>}
                </div>
                <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: ins.checked_in ? '#22c55e' : 'var(--color-text-muted)', background: ins.checked_in ? '#22c55e18' : 'transparent', border: ins.checked_in ? '1px solid #22c55e33' : '1px solid transparent', padding: '2px 8px', borderRadius: 20 }}>
                  {ins.checked_in ? '✓ Check-in' : 'Aguardando'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
