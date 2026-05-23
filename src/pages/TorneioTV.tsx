import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { RefreshCw, Wifi } from 'lucide-react'
import { useTorneio } from '@/hooks/useTorneio'
import { BracketEliminatorio } from '@/components/torneio/BracketEliminatorio'
import { BracketSuico } from '@/components/torneio/BracketSuico'
import { FaseDeGrupos } from '@/components/torneio/FaseDeGrupos'
import { RoundRobin } from '@/components/torneio/RoundRobin'
import { GruposStandings } from '@/components/torneio/GruposStandings'
import { formatFormato, formatStatus } from '@/lib/utils'

const REFRESH_INTERVAL = 30

export default function TorneioTV() {
  const { id } = useParams<{ id: string }>()
  const { torneio, partidas, inscricoes, loading, reload } = useTorneio(id!)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const doRefresh = useCallback(() => {
    reload()
    setLastUpdate(new Date())
    setCountdown(REFRESH_INTERVAL)
  }, [reload])

  // Auto-refresh countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { doRefresh(); return REFRESH_INTERVAL }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [doRefresh])

  const hasGrupos = torneio?.formato === 'fase_grupos' || torneio?.formato === 'copa_do_mundo'
  const finalizadas = partidas.filter(p => p.status === 'finalizada').length

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

  const renderBracket = () => {
    switch (torneio.formato) {
      case 'eliminatorio_simples':
      case 'eliminatorio_duplo':
      case 'copa_do_mundo':
        return <BracketEliminatorio partidas={partidas} isAdmin={false} onRefresh={reload} />
      case 'suico':
        return <BracketSuico partidas={partidas} isAdmin={false} onRefresh={reload} />
      case 'fase_grupos':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
            <FaseDeGrupos partidas={partidas} isAdmin={false} onRefresh={reload} pontos={{ vitoria: torneio.pontos_vitoria, empate: torneio.pontos_empate, derrota: torneio.pontos_derrota }} />
            <GruposStandings partidas={partidas.filter(p => p.fase === 'grupos')} inscricoes={inscricoes} pontos={{ vitoria: torneio.pontos_vitoria, empate: torneio.pontos_empate, derrota: torneio.pontos_derrota }} />
          </div>
        )
      case 'round_robin':
        return <RoundRobin partidas={partidas} isAdmin={false} onRefresh={reload} />
    }
  }

  return (
    <div style={{ background: '#080812', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        @keyframes tv-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(43,91,232,0.2) 0%, rgba(10,10,25,0.95) 100%)',
        borderBottom: '1px solid rgba(43,91,232,0.2)',
        padding: '20px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/">
            <img src="/logo.png" alt="LaBey" style={{ height: 36, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(43,91,232,0.6))' }} />
          </Link>
          <div>
            <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 'clamp(20px, 3vw, 32px)', margin: 0, letterSpacing: '0.5px' }}>
              {torneio.nome}
            </h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <span style={{ fontFamily: 'DM Sans', fontSize: 12, background: 'rgba(43,91,232,0.2)', color: '#93c5fd', padding: '2px 10px', borderRadius: 20 }}>
                {formatFormato(torneio.formato)}
              </span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {finalizadas}/{partidas.length} partidas
              </span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                · {inscricoes.length} participantes
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'tv-pulse 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 700, color: '#22c55e', letterSpacing: '0.06em' }}>AO VIVO</span>
          </div>

          {/* Refresh countdown */}
          <button onClick={doRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans', fontSize: 12 }}>
            <RefreshCw size={13} />
            {countdown}s
          </button>

          {/* Link to full page */}
          <Link to={`/torneios/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(43,91,232,0.2)', border: '1px solid rgba(43,91,232,0.3)', borderRadius: 8, padding: '6px 12px', color: '#93c5fd', fontFamily: 'DM Sans', fontSize: 12, textDecoration: 'none' }}>
            <Wifi size={13} /> Página completa
          </Link>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: '12px 32px', background: 'rgba(43,91,232,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Status: <strong style={{ color: torneio.status === 'em_andamento' ? '#22c55e' : 'rgba(255,255,255,0.6)' }}>{formatStatus(torneio.status)}</strong>
        </span>
        {torneio.premio && (
          <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            🏆 <strong style={{ color: '#f59e0b' }}>{torneio.premio}</strong>
          </span>
        )}
        <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>
          Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Bracket */}
      <div style={{ padding: '32px' }}>
        {partidas.length > 0 ? renderBracket() : (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans', fontSize: 16 }}>
            Partidas ainda não foram geradas
          </div>
        )}

        {/* Group standings (for fase_grupos in full-width) - already rendered inside renderBracket */}
        {hasGrupos && torneio.formato === 'copa_do_mundo' && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 22, marginBottom: 16, color: 'rgba(255,255,255,0.8)' }}>
              Classificação dos Grupos
            </h2>
            <GruposStandings
              partidas={partidas.filter(p => p.fase === 'grupos')}
              inscricoes={inscricoes}
              pontos={{ vitoria: torneio.pontos_vitoria, empate: torneio.pontos_empate, derrota: torneio.pontos_derrota }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

