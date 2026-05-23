import { useState, Fragment } from 'react'
import type { Partida } from '@/types'
import { MatchCard } from './MatchCard'
import { ResultadoModal } from './ResultadoModal'

const MATCH_H = 73
const STRIDE = 93
const CONN_W = 44
const CARD_W = 230

const FASE_ORDER = ['decasseis', 'oitavas', 'quartas', 'semi', 'final']
const FASE_NAME: Record<string, string> = {
  decasseis: 'Rodada 32', oitavas: 'Oitavas', quartas: 'Quartas', semi: 'Semifinal', final: 'Final',
}

function calcTops(numRounds: number): number[][] {
  const tops: number[][] = []
  const maxN = Math.pow(2, numRounds - 1)
  const totalH = maxN * STRIDE
  for (let r = 0; r < numRounds; r++) {
    const n = Math.pow(2, numRounds - 1 - r)
    const spacing = totalH / n
    tops.push(Array.from({ length: n }, (_, i) => spacing * i + spacing / 2 - MATCH_H / 2))
  }
  return tops
}

interface Props {
  partidas: Partida[]
  isAdmin?: boolean
  onRefresh?: () => void
}

export function BracketEliminatorio({ partidas, isAdmin, onRefresh }: Props) {
  const [modalPartida, setModalPartida] = useState<Partida | null>(null)

  const fasesPresentes = FASE_ORDER.filter(f => partidas.some(p => p.fase === f))
  if (fasesPresentes.length === 0) {
    const custom = [...new Set(partidas.map(p => p.fase))].sort()
    fasesPresentes.push(...custom)
  }

  const numRounds = fasesPresentes.length
  const allTops = calcTops(numRounds)
  const maxN = Math.pow(2, numRounds - 1)
  const totalH = maxN * STRIDE

  const finalMatch = partidas.find(p => p.fase === 'final')
  const isFinished = partidas.every(p => p.status === 'finalizada') && partidas.length > 0

  return (
    <>
      {isFinished && finalMatch && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          {(() => {
            const winner = finalMatch.vencedor_id === finalMatch.blade1_id ? finalMatch.blade1 : finalMatch.blade2
            return (
              <div style={{ flex: 1, minWidth: 180, background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04))', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 36 }}>🥇</span>
                <div>
                  <div style={{ fontFamily: 'Rajdhani', fontSize: 22, fontWeight: 700, color: '#FFD700' }}>{winner?.username ?? '—'}</div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>{winner?.nome_display}</div>
                </div>
              </div>
            )
          })()}
          {(() => {
            const runnerUp = finalMatch.vencedor_id === finalMatch.blade1_id ? finalMatch.blade2 : finalMatch.blade1
            const score = finalMatch.vencedor_id === finalMatch.blade1_id
              ? `${finalMatch.blade1_score} – ${finalMatch.blade2_score}`
              : `${finalMatch.blade2_score} – ${finalMatch.blade1_score}`
            return (
              <div style={{ flex: 1, minWidth: 180, background: 'rgba(192,192,192,0.06)', border: '1px solid rgba(192,192,192,0.2)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 36 }}>🥈</span>
                <div>
                  <div style={{ fontFamily: 'Rajdhani', fontSize: 22, fontWeight: 700, color: '#C0C0C0' }}>{runnerUp?.username ?? '—'}</div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>Placar final: {score}</div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
        <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', minWidth: numRounds * (CARD_W + CONN_W), position: 'relative' }}>
          {fasesPresentes.map((fase, roundIdx) => {
            const faseParts = partidas.filter(p => p.fase === fase).sort((a, b) => (a.posicao_bracket ?? 0) - (b.posicao_bracket ?? 0))
            const tops = allTops[roundIdx]
            const isLast = roundIdx === numRounds - 1
            const hasConnector = !isLast

            return (
              <div key={fase} style={{ display: 'flex', gap: 0 }}>
                <div style={{ position: 'relative', width: CARD_W, height: totalH }}>
                  <div style={{ fontFamily: 'Rajdhani', fontSize: 12, fontWeight: 700, color: 'var(--color-blue-light)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', position: 'absolute', top: -28, left: 0, right: 0 }}>
                    {FASE_NAME[fase] ?? fase}
                  </div>
                  {faseParts.map((p, matchIdx) => (
                    <div key={p.id} style={{ position: 'absolute', left: 0, right: 0, top: tops[matchIdx] ?? matchIdx * STRIDE }}>
                      <MatchCard partida={p} isAdmin={isAdmin} onRegistrar={() => setModalPartida(p)} onRefresh={onRefresh} />
                    </div>
                  ))}
                  {hasConnector && faseParts.map((_, matchIdx) => {
                    const t = tops[matchIdx] ?? matchIdx * STRIDE
                    const center = t + MATCH_H / 2
                    const isPairTop = matchIdx % 2 === 0
                    const pairPartnerIdx = isPairTop ? matchIdx + 1 : matchIdx - 1
                    const partnerTop = tops[pairPartnerIdx] ?? pairPartnerIdx * STRIDE
                    const partnerCenter = partnerTop + MATCH_H / 2
                    const midY = (center + partnerCenter) / 2
                    return (
                      <Fragment key={`conn-${matchIdx}`}>
                        <div style={{ position: 'absolute', top: center - 1, left: CARD_W, width: CONN_W / 2, height: 2, background: 'var(--color-border)' }} />
                        {isPairTop && <div style={{ position: 'absolute', top: center, left: CARD_W + CONN_W / 2 - 1, width: 2, height: partnerCenter - center, background: 'var(--color-border)' }} />}
                        {isPairTop && <div style={{ position: 'absolute', top: midY - 1, left: CARD_W + CONN_W / 2, width: CONN_W / 2, height: 2, background: 'var(--color-border)' }} />}
                      </Fragment>
                    )
                  })}
                </div>
                {hasConnector && <div style={{ width: CONN_W, flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
      </div>

      {modalPartida && (
        <ResultadoModal partida={modalPartida} onClose={() => setModalPartida(null)} onSaved={() => { setModalPartida(null); onRefresh?.() }} />
      )}
    </>
  )
}
