import { useState } from 'react'
import type { Partida } from '@/types'
import { MatchCard } from './MatchCard'
import { ResultadoModal } from './ResultadoModal'

interface Props {
  partidas: Partida[]
  isAdmin?: boolean
  onRefresh?: () => void
}

export function BracketSuico({ partidas, isAdmin, onRefresh }: Props) {
  const [modalPartida, setModalPartida] = useState<Partida | null>(null)
  const rodadas = [...new Set(partidas.map(p => p.numero_rodada).filter(Boolean) as number[])].sort((a, b) => a - b)

  const statusCounts = (rPartidas: Partida[]) => {
    const done = rPartidas.filter(p => p.status === 'finalizada').length
    return `${done}/${rPartidas.length} finalizadas`
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', gap: 24, minWidth: 'max-content', alignItems: 'flex-start' }}>
        {rodadas.map(rodada => {
          const rodadaPartidas = partidas.filter(p => p.numero_rodada === rodada)
          const allDone = rodadaPartidas.every(p => p.status === 'finalizada')
          return (
            <div key={rodada} style={{ minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: 'Rajdhani', fontSize: 14, fontWeight: 700, color: 'var(--color-blue-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Rodada {rodada}
                </span>
                <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: allDone ? 'var(--color-success)' : 'var(--color-text-muted)', background: allDone ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10 }}>
                  {statusCounts(rodadaPartidas)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rodadaPartidas.map(p => (
                  <MatchCard key={p.id} partida={p} isAdmin={isAdmin} onRegistrar={() => setModalPartida(p)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {modalPartida && (
        <ResultadoModal partida={modalPartida} onClose={() => setModalPartida(null)} onSaved={() => { setModalPartida(null); onRefresh?.() }} />
      )}
    </div>
  )
}
