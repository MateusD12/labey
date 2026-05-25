import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { RefreshCw, Wifi } from 'lucide-react'
import { useTorneio } from '@/hooks/useTorneio'
import { BracketEliminatorio } from '@/components/torneio/BracketEliminatorio'
import { BracketDuplo } from '@/components/torneio/BracketDuplo'
import { FaseDeGrupos } from '@/components/torneio/FaseDeGrupos'
import { calcularClassificacaoGrupo } from '@/lib/algorithms/grupos'
import { formatFormato, formatStatus } from '@/lib/utils'
import type { Partida } from '@/types'

const REFRESH_INTERVAL = 10

type TVTab = 'grupos' | 'eliminatoria' | 'geral'

export default function TorneioTV() {
  const { id } = useParams<{ id: string }>()
  const { torneio, partidas, inscricoes, loading, reload } = useTorneio(id!)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [tvTab, setTvTab] = useState<TVTab>('grupos')

  const isCopaMundo = torneio?.formato === 'copa_do_mundo'
  const isFaseGrupos = torneio?.formato === 'fase_grupos'
  const hasGrupos = isCopaMundo || isFaseGrupos

  const gruposPartidas = partidas.filter(p => p.fase === 'grupos')
  const elimPartidas = partidas.filter(p => p.fase !== 'grupos')
  const temElimAtiva = isCopaMundo && elimPartidas.some(p => p.blade1_id || p.blade2_id)

  // Auto-switch to eliminatoria tab when it becomes active
  useEffect(() => {
    if (temElimAtiva && tvTab === 'grupos') setTvTab('eliminatoria')
  }, [temElimAtiva])

  const doRefresh = useCallback(() => {
    reload()
    setLastUpdate(new Date())
    setCountdown(REFRESH_INTERVAL)
  }, [reload])

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { doRefresh(); return REFRESH_INTERVAL }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [doRefresh])

  const finalizadas = partidas.filter(p => p.status === 'finalizada').length

  // Recent results: last 5 finalized matches
  const recentResults = [...partidas]
    .filter(p => p.status === 'finalizada' && p.blade1_id && p.blade2_id)
    .slice(-5)
    .reverse()

  // Top 10 global standings (for non-bracket formats during group phase)
  const ptsProps = torneio
    ? { vitoria: torneio.pontos_vitoria, empate: torneio.pontos_empate, derrota: torneio.pontos_derrota }
    : { vitoria: 3, empate: 1, derrota: 0 }

  const top10 = (() => {
    if (!hasGrupos || gruposPartidas.length === 0) return []
    const cls = calcularClassificacaoGrupo(gruposPartidas, ptsProps)
    return [...cls.values()]
      .sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.vitorias - a.vitorias)
      .slice(0, 10)
      .map(c => {
        const perfil =
          gruposPartidas.find(p => p.blade1_id === c.blade_id)?.blade1 ??
          gruposPartidas.find(p => p.blade2_id === c.blade_id)?.blade2
        return { ...c, username: perfil?.username ?? c.blade_id.slice(0, 8) }
      })
  })()

  if (loading) return (
    <div style={{ background: '#080812', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Rajdhani', fontSize: 24, color: 'rgba(255,255,255,0.4)' }}>Carregando...</div>
    </div>
  )

  if (!torneio) return (
    <div style={{ background: '#080812', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Rajdhani', fontSize: 24, color: 'rgba(255,255,255,0.4)' }}>Torneio não encontrado</div>
    </div>
  )

  const renderMainContent = () => {
    if (isCopaMundo) {
      if (tvTab === 'grupos') {
        return gruposPartidas.length > 0
          ? <FaseDeGrupos partidas={gruposPartidas} isAdmin={false} onRefresh={reload} pontos={ptsProps} tvMode />
          : <EmptyMsg>Partidas de grupo ainda não geradas</EmptyMsg>
      }
      if (tvTab === 'eliminatoria') {
        return temElimAtiva
          ? <BracketEliminatorio partidas={elimPartidas} isAdmin={false} onRefresh={reload} />
          : <EmptyMsg>Fase eliminatória começa quando todos os grupos concluírem</EmptyMsg>
      }
    }

    switch (torneio.formato) {
      case 'eliminatorio_simples':
        return <BracketEliminatorio partidas={partidas} isAdmin={false} onRefresh={reload} />
      case 'eliminatorio_duplo':
        return <BracketDuplo partidas={partidas} isAdmin={false} onRefresh={reload} />
      case 'fase_grupos':
        return <FaseDeGrupos partidas={partidas} isAdmin={false} onRefresh={reload} pontos={ptsProps} tvMode />
    }
    return null
  }

  const tabActive: React.CSSProperties = {
    background: 'rgba(43,91,232,0.3)', color: '#93c5fd',
    border: '1px solid rgba(43,91,232,0.5)', borderRadius: 8,
    padding: '6px 18px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 700,
  }
  const tabInactive: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '6px 18px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 500,
  }

  return (
    <div style={{ background: '#080812', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        @keyframes tv-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes tv-slide { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(43,91,232,0.2) 0%, rgba(10,10,25,0.95) 100%)',
        borderBottom: '1px solid rgba(43,91,232,0.2)',
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/"><img src="/logo.png" alt="LaBey" style={{ height: 36, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(43,91,232,0.6))' }} /></Link>
          <div>
            <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 'clamp(20px, 3vw, 32px)', margin: 0, letterSpacing: '0.5px' }}>
              {torneio.nome}
            </h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'DM Sans', fontSize: 12, background: 'rgba(43,91,232,0.2)', color: '#93c5fd', padding: '2px 10px', borderRadius: 20 }}>{formatFormato(torneio.formato)}</span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{finalizadas}/{partidas.length} partidas</span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>· {inscricoes.length} participantes</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'tv-pulse 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 700, color: '#22c55e', letterSpacing: '0.06em' }}>AO VIVO</span>
          </div>
          <button onClick={doRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans', fontSize: 12 }}>
            <RefreshCw size={13} />{countdown}s
          </button>
          <Link to={`/torneios/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(43,91,232,0.2)', border: '1px solid rgba(43,91,232,0.3)', borderRadius: 8, padding: '6px 12px', color: '#93c5fd', fontFamily: 'DM Sans', fontSize: 12, textDecoration: 'none' }}>
            <Wifi size={13} /> Página completa
          </Link>
        </div>
      </div>

      {/* Status + recent results bar */}
      <div style={{ padding: '10px 32px', background: 'rgba(43,91,232,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
          Status: <strong style={{ color: torneio.status === 'em_andamento' ? '#22c55e' : 'rgba(255,255,255,0.6)' }}>{formatStatus(torneio.status)}</strong>
        </span>
        {torneio.premio && (
          <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
            🏆 <strong style={{ color: '#f59e0b' }}>{torneio.premio}</strong>
          </span>
        )}
        {recentResults.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>Recentes:</span>
            {recentResults.map(p => (
              <RecentResult key={p.id} partida={p} />
            ))}
          </div>
        )}
        <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto', flexShrink: 0 }}>
          {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Tabs for Copa do Mundo */}
      {isCopaMundo && (
        <div style={{ padding: '12px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={tvTab === 'grupos' ? tabActive : tabInactive} onClick={() => setTvTab('grupos')}>Fase de Grupos</button>
          <button style={tvTab === 'eliminatoria' ? tabActive : tabInactive} onClick={() => setTvTab('eliminatoria')}>
            Eliminatória {temElimAtiva ? '🔴' : ''}
          </button>
        </div>
      )}

      {/* Main content area: top 10 + bracket side by side during group phase */}
      <div style={{ padding: '28px 32px' }}>
        {hasGrupos && top10.length > 0 && tvTab !== 'eliminatoria' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 280px) 1fr', gap: 28, alignItems: 'start' }}>
            {/* Top 10 panel */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 20 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(43,91,232,0.1)' }}>
                <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1 }}>Top 10</span>
              </div>
              <div>
                {top10.map((c, i) => (
                  <div key={c.blade_id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                    borderBottom: i < 9 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: i < 2 ? 'rgba(43,91,232,0.08)' : 'transparent',
                    animation: 'tv-slide 0.3s ease',
                  }}>
                    <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13, minWidth: 20, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.35)' }}>
                      {i + 1}
                    </span>
                    <span style={{ fontFamily: 'DM Sans', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: i < 2 ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: i < 2 ? 600 : 400 }}>
                      {c.username}
                    </span>
                    <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: '#93c5fd' }}>{c.pontos}</span>
                    <span style={{ fontFamily: 'DM Sans', fontSize: 10, color: 'rgba(255,255,255,0.3)', minWidth: 28, textAlign: 'right' }}>{c.vitorias}V</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Bracket */}
            <div style={{ minWidth: 0 }}>
              {partidas.length > 0 ? renderMainContent() : <EmptyMsg>Partidas ainda não foram geradas</EmptyMsg>}
            </div>
          </div>
        ) : (
          partidas.length > 0 ? renderMainContent() : (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans', fontSize: 16 }}>
              Partidas ainda não foram geradas
            </div>
          )
        )}
      </div>
    </div>
  )
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans', fontSize: 15 }}>
      {children}
    </div>
  )
}

function RecentResult({ partida }: { partida: Partida }) {
  const isW1 = partida.vencedor_id === partida.blade1_id
  const w = isW1 ? partida.blade1 : partida.blade2
  const l = isW1 ? partida.blade2 : partida.blade1
  const scoreW = isW1 ? partida.blade1_score : partida.blade2_score
  const scoreL = isW1 ? partida.blade2_score : partida.blade1_score
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 6, padding: '3px 8px', animation: 'tv-slide 0.3s ease', flexShrink: 0 }}>
      <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{w?.username ?? '?'}</span>
      <span style={{ fontFamily: 'Rajdhani', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{scoreW}–{scoreL}</span>
      <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{l?.username ?? '?'}</span>
    </div>
  )
}
