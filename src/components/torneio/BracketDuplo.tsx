import { useState, Fragment } from 'react'
import type { Partida } from '@/types'
import { MatchCard } from './MatchCard'
import { ResultadoModal } from './ResultadoModal'

const MATCH_H = 73
const STRIDE = 93
const CONN_W = 44
const CARD_W = 230

function calcTopsForRound(totalMatches: number, roundMatchCount: number, totalH: number): number[] {
  const spacing = totalH / roundMatchCount
  return Array.from({ length: roundMatchCount }, (_, i) => spacing * i + spacing / 2 - MATCH_H / 2)
}

interface Props {
  partidas: Partida[]
  isAdmin?: boolean
  onRefresh?: () => void
}

export function BracketDuplo({ partidas, isAdmin, onRefresh }: Props) {
  const [modalPartida, setModalPartida] = useState<Partida | null>(null)

  const wbMatches = partidas.filter(p => p.fase === 'winners')
  const lbMatches = partidas.filter(p => p.fase === 'losers')
  const gfMatch = partidas.find(p => p.fase === 'grand_final' && (p.numero_rodada ?? 1) === 1)
  const gfReset = partidas.find(p => p.fase === 'grand_final' && (p.numero_rodada ?? 1) === 2)
  const gfResetActive = !!(gfReset && (gfReset.blade1_id || gfReset.blade2_id))

  const wbRounds = [...new Set(wbMatches.map(p => p.numero_rodada ?? 0))].sort((a, b) => a - b)
  const lbRounds = [...new Set(lbMatches.map(p => p.numero_rodada ?? 0))].sort((a, b) => a - b)

  const k = wbRounds.length
  const lbTotalRounds = 2 * (k - 1)

  // WB total height based on R1 match count
  const wbR1Count = wbMatches.filter(p => p.numero_rodada === 1).length
  const wbTotalH = Math.max(wbR1Count, 1) * STRIDE

  // LB total height based on LBR1 match count
  const lbR1Count = lbMatches.filter(p => p.numero_rodada === 1).length
  const lbTotalH = Math.max(lbR1Count, 1) * STRIDE

  const wbRoundLabel = (r: number) => {
    if (r === k) return 'WB Final'
    if (r === k - 1 && k > 2) return 'WB Semi'
    return `WB R${r}`
  }

  const lbRoundLabel = (r: number) => {
    if (r === lbTotalRounds) return 'LB Final'
    return `LB R${r}`
  }

  // Champion: GF2 winner if bracket reset occurred, otherwise GF1 winner
  const gf2Done = gfReset?.status === 'finalizada' && gfReset?.vencedor_id
  const gf1Done = gfMatch?.status === 'finalizada' && gfMatch?.vencedor_id
  const finalMatch = gf2Done ? gfReset! : gf1Done ? gfMatch! : null
  const champion = finalMatch
    ? (finalMatch.vencedor_id === finalMatch.blade1_id ? finalMatch.blade1 : finalMatch.blade2)
    : null

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'Rajdhani', fontSize: 13, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '1px',
    marginBottom: 12,
  }

  const roundHeaderStyle: React.CSSProperties = {
    fontFamily: 'Rajdhani', fontSize: 12, fontWeight: 700,
    color: 'var(--color-blue-light)', textTransform: 'uppercase',
    letterSpacing: '1px', textAlign: 'center',
    position: 'absolute', top: -28, left: 0, right: 0,
  }

  return (
    <>
      {champion && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04))', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 36 }}>🥇</span>
            <div>
              <div style={{ fontFamily: 'Rajdhani', fontSize: 22, fontWeight: 700, color: '#FFD700' }}>{champion?.username ?? '—'}</div>
              <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>Campeão — Chave Dupla</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── Winners Bracket ─────────────────────────────── */}
        {wbRounds.length > 0 && (
          <div>
            <div style={{ ...sectionLabel, color: 'var(--color-blue-light)', marginBottom: 20 }}>
              🏆 Chave de Vencedores
            </div>
            <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
              <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', minWidth: k * (CARD_W + CONN_W) + CARD_W, position: 'relative', paddingTop: 32 }}>
                {wbRounds.map((r, ri) => {
                  const matches = wbMatches.filter(p => p.numero_rodada === r).sort((a, b) => (a.posicao_bracket ?? 0) - (b.posicao_bracket ?? 0))
                  const tops = calcTopsForRound(wbR1Count, matches.length, wbTotalH)
                  const isLast = ri === wbRounds.length - 1

                  return (
                    <div key={r} style={{ display: 'flex', gap: 0 }}>
                      <div style={{ position: 'relative', width: CARD_W, height: wbTotalH }}>
                        <div style={roundHeaderStyle}>{wbRoundLabel(r)}</div>
                        {matches.map((p, mi) => (
                          <div key={p.id} style={{ position: 'absolute', left: 0, right: 0, top: tops[mi] ?? mi * STRIDE }}>
                            <MatchCard partida={p} isAdmin={isAdmin} onRegistrar={() => setModalPartida(p)} onRefresh={onRefresh} />
                          </div>
                        ))}
                        {!isLast && matches.map((_, mi) => {
                          const t = tops[mi] ?? mi * STRIDE
                          const center = t + MATCH_H / 2
                          const isPairTop = mi % 2 === 0
                          const partnerCenter = (tops[isPairTop ? mi + 1 : mi - 1] ?? (isPairTop ? mi + 1 : mi - 1) * STRIDE) + MATCH_H / 2
                          const midY = (center + partnerCenter) / 2
                          return (
                            <Fragment key={`wconn-${mi}`}>
                              <div style={{ position: 'absolute', top: center - 1, left: CARD_W, width: CONN_W / 2, height: 2, background: 'var(--color-border)' }} />
                              {isPairTop && <div style={{ position: 'absolute', top: center, left: CARD_W + CONN_W / 2 - 1, width: 2, height: partnerCenter - center, background: 'var(--color-border)' }} />}
                              {isPairTop && <div style={{ position: 'absolute', top: midY - 1, left: CARD_W + CONN_W / 2, width: CONN_W / 2, height: 2, background: 'var(--color-border)' }} />}
                            </Fragment>
                          )
                        })}
                      </div>
                      {!isLast && <div style={{ width: CONN_W, flexShrink: 0 }} />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Losers Bracket ──────────────────────────────── */}
        {lbRounds.length > 0 && (
          <div>
            <div style={{ ...sectionLabel, color: '#f97316', marginBottom: 20 }}>
              🔁 Chave de Perdedores
            </div>
            <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
              <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', minWidth: lbTotalRounds * (CARD_W + CONN_W) + CARD_W, position: 'relative', paddingTop: 32 }}>
                {lbRounds.map((lbr, lbri) => {
                  const matches = lbMatches.filter(p => p.numero_rodada === lbr).sort((a, b) => (a.posicao_bracket ?? 0) - (b.posicao_bracket ?? 0))
                  const tops = calcTopsForRound(lbR1Count, matches.length, lbTotalH)
                  const isLast = lbri === lbRounds.length - 1
                  const isConsolidation = lbr % 2 === 0 // even = consolidation (halving), odd = drop or R1

                  return (
                    <div key={lbr} style={{ display: 'flex', gap: 0 }}>
                      <div style={{ position: 'relative', width: CARD_W, height: lbTotalH }}>
                        <div style={{ ...roundHeaderStyle, color: isConsolidation ? '#fb923c' : '#f97316' }}>
                          {lbRoundLabel(lbr)}
                        </div>
                        {matches.map((p, mi) => (
                          <div key={p.id} style={{ position: 'absolute', left: 0, right: 0, top: tops[mi] ?? mi * STRIDE }}>
                            <MatchCard partida={p} isAdmin={isAdmin} onRegistrar={() => setModalPartida(p)} onRefresh={onRefresh} />
                          </div>
                        ))}
                        {!isLast && !isConsolidation && matches.map((_, mi) => {
                          const t = tops[mi] ?? mi * STRIDE
                          const center = t + MATCH_H / 2
                          return (
                            <Fragment key={`lconn-${mi}`}>
                              <div style={{ position: 'absolute', top: center - 1, left: CARD_W, width: CONN_W, height: 2, background: 'rgba(249,115,22,0.4)' }} />
                            </Fragment>
                          )
                        })}
                        {!isLast && isConsolidation && matches.map((_, mi) => {
                          const t = tops[mi] ?? mi * STRIDE
                          const center = t + MATCH_H / 2
                          const isPairTop = mi % 2 === 0
                          const partnerCenter = (tops[isPairTop ? mi + 1 : mi - 1] ?? (isPairTop ? mi + 1 : mi - 1) * STRIDE) + MATCH_H / 2
                          const midY = (center + partnerCenter) / 2
                          return (
                            <Fragment key={`lcconn-${mi}`}>
                              <div style={{ position: 'absolute', top: center - 1, left: CARD_W, width: CONN_W / 2, height: 2, background: 'rgba(249,115,22,0.4)' }} />
                              {isPairTop && <div style={{ position: 'absolute', top: center, left: CARD_W + CONN_W / 2 - 1, width: 2, height: partnerCenter - center, background: 'rgba(249,115,22,0.4)' }} />}
                              {isPairTop && <div style={{ position: 'absolute', top: midY - 1, left: CARD_W + CONN_W / 2, width: CONN_W / 2, height: 2, background: 'rgba(249,115,22,0.4)' }} />}
                            </Fragment>
                          )
                        })}
                      </div>
                      {!isLast && <div style={{ width: CONN_W, flexShrink: 0 }} />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Grand Final ─────────────────────────────────── */}
        {gfMatch && (
          <div>
            <div style={{ ...sectionLabel, color: '#FFD700', marginBottom: 16 }}>
              🏆 Grande Final
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* GF1 */}
              <div>
                <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Partida 1
                </div>
                <div style={{ minWidth: CARD_W }}>
                  <MatchCard
                    partida={gfMatch}
                    isAdmin={isAdmin}
                    onRegistrar={() => setModalPartida(gfMatch)}
                    onRefresh={onRefresh}
                  />
                </div>
                <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, maxWidth: CARD_W }}>
                  <span style={{ color: 'var(--color-blue-light)' }}>WB champ</span> (0 derrotas) vs <span style={{ color: '#f97316' }}>LB champ</span> (1 derrota)
                </div>
              </div>

              {/* Arrow or separator */}
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: 36, color: 'var(--color-text-muted)', fontSize: 20 }}>
                →
              </div>

              {/* GF2 / Bracket Reset */}
              <div>
                <div style={{
                  fontFamily: 'DM Sans', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: gfResetActive ? '#f59e0b' : 'var(--color-text-muted)',
                }}>
                  {gfResetActive ? '🔁 Reset de Chave!' : 'Reset de Chave (se LB vencer)'}
                </div>
                {gfReset && gfResetActive ? (
                  <div style={{ minWidth: CARD_W }}>
                    <MatchCard
                      partida={gfReset}
                      isAdmin={isAdmin}
                      onRegistrar={() => setModalPartida(gfReset)}
                      onRefresh={onRefresh}
                    />
                  </div>
                ) : (
                  <div style={{ minWidth: CARD_W, height: 73, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Aguardando resultado
                    </span>
                  </div>
                )}
                {gfResetActive && (
                  <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, maxWidth: CARD_W }}>
                    Ambos com 1 derrota — partida decisiva final
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {modalPartida && (
        <ResultadoModal
          partida={modalPartida}
          onClose={() => setModalPartida(null)}
          onSaved={() => { setModalPartida(null); onRefresh?.() }}
        />
      )}
    </>
  )
}
