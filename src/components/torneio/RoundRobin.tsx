import { useState } from 'react'
import type { Partida } from '@/types'
import { MatchCard } from './MatchCard'
import { ResultadoModal } from './ResultadoModal'

interface Props {
  partidas: Partida[]
  isAdmin?: boolean
  onRefresh?: () => void
}

export function RoundRobin({ partidas, isAdmin, onRefresh }: Props) {
  const [modalPartida, setModalPartida] = useState<Partida | null>(null)
  const rodadas = [...new Set(partidas.map(p => p.numero_rodada).filter(Boolean) as number[])].sort((a, b) => a - b)

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', gap: 20, minWidth: 'max-content', alignItems: 'flex-start' }}>
        {rodadas.map(rodada => {
          const rodadaPartidas = partidas.filter(p => p.numero_rodada === rodada)
          const allDone = rodadaPartidas.every(p => p.status === 'finalizada')
          return (
            <div key={rodada} style={{ minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: 'Rajdhani', fontSize: 14, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Rodada {rodada}
                </span>
                {allDone && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rodadaPartidas.map(p => (
                  <MatchCard key={p.id} partida={p} isAdmin={isAdmin} onRegistrar={() => setModalPartida(p)} onRefresh={onRefresh} />
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
