import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/lib/auth'
import { useTorneio } from '@/hooks/useTorneio'
import { supabase } from '@/lib/supabase'
import { gerarBracketEliminatorio } from '@/lib/algorithms/eliminatorio'
import { gerarRodadaSuica } from '@/lib/algorithms/swiss'
import { distribuirEmGrupos, gerarPartidasGrupos } from '@/lib/algorithms/grupos'
import { gerarPartidasRoundRobin } from '@/lib/algorithms/roundrobin'
import type { Inscricao, Ranking } from '@/types'

export default function TorneioAdmin() {
  const { id } = useParams<{ id: string }>()
  const { perfil } = useAuth()
  const { torneio, inscricoes, partidas, loading } = useTorneio(id!)
  const [pendentes, setPendentes] = useState<Inscricao[]>([])
  const [allRankings, setAllRankings] = useState<Ranking[]>([])
  const [linkedRankingIds, setLinkedRankingIds] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState('')

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
    loadRankings()
  }, [id, loadRankings])

  const toggleRanking = async (rankingId: string) => {
    if (linkedRankingIds.has(rankingId)) {
      await supabase.from('ranking_torneios').delete().eq('torneio_id', id).eq('ranking_id', rankingId)
    } else {
      await supabase.from('ranking_torneios').insert({ torneio_id: id, ranking_id: rankingId })
    }
    await loadRankings()
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

  const gerarProximaRodadaSuica = async () => {
    if (!partidas.length) { setMsg('Nenhuma partida encontrada.'); return }

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
      await supabase.from('partidas').insert(novasPartidas)
      setMsg(`Rodada ${rodadaAtual + 1} gerada com ${novasPartidas.length} partidas!`)
    } else {
      setMsg('Nao foi possivel gerar novos pares (todos ja jogaram entre si?).')
    }
  }

  const gerarPartidas = async () => {
    const ids = inscricoes.map(i => i.blade_id)
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
    if (partidas.length > 0) {
      await supabase.from('partidas').insert(partidas)
      await supabase.from('torneios').update({ status: 'em_andamento' }).eq('id', id)
      setMsg(`✅ ${partidas.length} partidas geradas! Torneio em andamento.`)
    }
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

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Rajdhani', fontSize: '18px', marginBottom: 16 }}>Ações</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {torneio.status === 'rascunho' && <button onClick={() => atualizarStatus('inscricoes')} className="btn-primary">Abrir inscrições</button>}
            {torneio.status === 'inscricoes' && <button onClick={gerarPartidas} className="btn-primary">Gerar partidas e iniciar</button>}
            {torneio.status === 'em_andamento' && torneio.formato === 'suico' && (
              <button onClick={gerarProximaRodadaSuica} className="btn-primary">Gerar proxima rodada</button>
            )}
            {torneio.status === 'em_andamento' && <button onClick={() => atualizarStatus('finalizado')} style={{ background: 'var(--color-success)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500 }}>Finalizar torneio</button>}
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

        <div className="card">
          <h2 style={{ fontFamily: 'Rajdhani', fontSize: '18px', marginBottom: 16 }}>Participantes Aprovados ({inscricoes.length})</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {inscricoes.map(ins => <span key={ins.id} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 12px', fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{ins.perfil?.nome_display ?? ins.blade_id.slice(0, 8)}</span>)}
          </div>
        </div>
      </main>
    </>
  )
}
