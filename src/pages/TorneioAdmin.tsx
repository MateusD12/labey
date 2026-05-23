import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/lib/auth'
import { useTorneio } from '@/hooks/useTorneio'
import { supabase } from '@/lib/supabase'
import { gerarBracketEliminatorio } from '@/lib/algorithms/eliminatorio'
import { gerarRodadaSuica } from '@/lib/algorithms/swiss'
import { distribuirEmGrupos, gerarPartidasGrupos, calcularClassificacaoGrupo } from '@/lib/algorithms/grupos'
import { gerarPartidasRoundRobin } from '@/lib/algorithms/roundrobin'
import type { Inscricao, Ranking, TorneioJuiz, Perfil } from '@/types'

export default function TorneioAdmin() {
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
    if (partidas.some(p => p.fase !== 'grupos')) { setMsg('Fase eliminatoria ja foi gerada.'); return }

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

    const classificados: string[] = []
    porGrupo.forEach(membros => {
      membros.sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.gp - a.gp)
        .slice(0, torneio.classificados_por_grupo)
        .forEach(m => classificados.push(m.blade_id))
    })

    if (classificados.length < 2) { setMsg('Classificados insuficientes para gerar bracket.'); return }

    const novasPartidas = gerarBracketEliminatorio(classificados, id!)
    const { error: elimErr } = await supabase.from('partidas').insert(novasPartidas)
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
    let partidas: any[] = []
    const fmt = torneio.formato
    if (fmt === 'eliminatorio_simples' || fmt === 'eliminatorio_duplo' || fmt === 'copa_do_mundo') {
      partidas = gerarBracketEliminatorio(ids, id!)
    } else if (fmt === 'suico') {
      partidas = gerarRodadaSuica(ids.map(pid => ({ id: pid, pontos: 0, adversarios: [] })), 1, id!) as any[]
    } else if (fmt === 'fase_grupos') {
      const insComGrupo = distribuirEmGrupos(inscricoes, torneio.num_grupos)
      await Promise.all(insComGrupo.map(i => supabase.from('inscricoes').update({ grupo: i.grupo }).eq('id', i.id)))
      partidas = gerarPartidasGrupos(insComGrupo, id!) as any[]
    } else if (fmt === 'round_robin') {
      partidas = gerarPartidasRoundRobin(ids, id!) as any[]
    }
    if (partidas.length === 0) { setMsg('Não foi possível gerar partidas. Verifique o número de participantes.'); return }
    const { error: insertErr } = await supabase.from('partidas').insert(partidas)
    if (insertErr) { setMsg(`Erro ao salvar partidas: ${insertErr.message}`); return }
    await supabase.from('torneios').update({ status: 'em_andamento' }).eq('id', id)
    await reload()
    setMsg(`✅ ${partidas.length} partidas geradas! Torneio em andamento.`)
  }

  const atualizarStatus = async (status: string) => {
    await supabase.from('torneios').update({ status }).eq('id', id)
    setMsg(`Status atualizado para: ${status}`)
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
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
            {torneio.status === 'em_andamento' && torneio.formato === 'copa_do_mundo' && (
              <button onClick={avancarParaFaseEliminatoria} className="btn-primary">Avancar para fase eliminatoria</button>
            )}
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
                    <div key={jg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: atribuido ? (atribuido.tipo === 'titular' ? 'rgba(43,91,232,0.08)' : 'rgba(245,158,11,0.07)') : 'var(--color-bg-secondary)', border: '1px solid', borderColor: atribuido ? (atribuido.tipo === 'titular' ? 'rgba(43,91,232,0.3)' : 'rgba(245,158,11,0.3)') : 'var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16 }}>⚖️</span>
                        <div>
                          <span style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{jg.nome_display}</span>
                          <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>@{jg.username}</span>
                          {isParticipante && <span style={{ fontFamily: 'DM Sans', fontSize: 10, marginLeft: 8, background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)', padding: '1px 6px', borderRadius: 10 }}>também participa</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {atribuido ? (
                          <>
                            <button onClick={() => addJuiz(jg.id, atribuido.tipo === 'titular' ? 'reserva' : 'titular')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, background: atribuido.tipo === 'titular' ? 'rgba(43,91,232,0.2)' : 'rgba(245,158,11,0.2)', color: atribuido.tipo === 'titular' ? 'var(--color-blue-light)' : 'var(--color-warning)' }}>
                              {atribuido.tipo === 'titular' ? '★ Titular' : '◎ Reserva'}
                            </button>
                            <button onClick={() => removeJuiz(atribuido.id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 11 }}>Remover</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => addJuiz(jg.id, 'titular')} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, background: 'rgba(43,91,232,0.12)', color: 'var(--color-blue-light)' }}>+ Titular</button>
                            <button onClick={() => addJuiz(jg.id, 'reserva')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.07)', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: 'var(--color-warning)' }}>+ Reserva</button>
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
