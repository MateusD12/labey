import { useState, Fragment } from 'react'
import type { Partida } from '@/types'
import { MatchCard } from './MatchCard'
import { ResultadoModalDuplo } from './ResultadoModalDuplo'
import { useBracketDuplo } from '@/hooks/useBracketDuplo'

const MATCH_H = 73
const STRIDE = 93
const CONN_W = 44
const CARD_W = 230

const getPIndex = (p: Partida) => Math.max(0, (p.posicao_bracket ?? 1) - 1)
const getWBTop = (r: number, pIndex: number) => {
  const multiplier = Math.pow(2, r - 1)
  const offset = (multiplier - 1) * (STRIDE / 2)
  return pIndex * multiplier * STRIDE + offset
}
const getLBTop = (r: number, pIndex: number) => {
  const tier = Math.ceil(r / 2)
  const multiplier = Math.pow(2, tier - 1)
  const offset = (multiplier - 1) * (STRIDE / 2)
  return pIndex * multiplier * STRIDE + offset
}

interface Props {
  partidas: Partida[]
  torneioId: string
  isAdmin?: boolean
  onRefresh?: () => void
}

export function BracketDuplo({ partidas, torneioId, isAdmin, onRefresh }: Props) {
  const [modalPartida, setModalPartida] = useState<Partida | null>(null)
  const { registrarResultado } = useBracketDuplo({ torneioId, partidas, onRefresh })

  const wbMatches = partidas.filter(p => p.fase === 'winners')
  const lbMatches = partidas.filter(p => p.fase === 'losers')
  const gfMatch = partidas.find(p => p.fase === 'grand_final' && (p.numero_rodada ?? 1) === 1)
  const gfReset = partidas.find(p => p.fase === 'grand_final' && (p.numero_rodada ?? 1) === 2)
  const gfResetActive = !!(gfReset && (gfReset.blade1_id || gfReset.blade2_id))

  const wbRounds = [...new Set(wbMatches.map(p => p.numero_rodada ?? 0))].sort((a, b) => a - b)
  const lbRounds = [...new Set(lbMatches.map(p => p.numero_rodada ?? 0))].sort((a, b) => a - b)

  const k = wbRounds.length
  const lbTotalRounds = 2 * (Math.max(k, 1) - 1)
  const wbR1MaxPIndex = Math.max(0, ...wbMatches.filter(p => p.numero_rodada === 1).map(getPIndex))
  const wbTotalH = Math.max(wbR1MaxPIndex + 1, 1) * STRIDE
  const lbR1MaxPIndex = Math.max(0, ...lbMatches.filter(p => p.numero_rodada === 1).map(getPIndex))
  const lbTotalH = Math.max(lbR1MaxPIndex + 1, 1) * STRIDE

  const wbRoundLabel = (r: number) => (r === k ? 'WB Final' : r === k - 1 && k > 2 ? 'WB Semi' : `WB R${r}`)
  const lbRoundLabel = (r: number) => (r === lbTotalRounds ? 'LB Final' : `LB R${r}`)

  const champion = (gfReset?.status === 'finalizada' && gfReset?.vencedor_id) ? (gfReset.vencedor_id === gfReset.blade1_id ? gfReset.blade1 : gfReset.blade2) :
                   (gfMatch?.status === 'finalizada' && gfMatch?.vencedor_id) ? (gfMatch.vencedor_id === gfMatch.blade1_id ? gfMatch.blade1 : gfMatch.blade2) : null

  return (
    <>
      {champion && <div style={{ marginBottom: 28 }}>{champion.username} é o campeão!</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {wbRounds.map((r, ri) => (
          <div key={r}>
            {wbMatches.filter(p => p.numero_rodada === r).map(p => {
              console.log("Debug Partida ID:", p.id, "Blade1:", p.blade1, "Blade2:", p.blade2);
              return (
                <Fragment key={p.id}>
                  <MatchCard partida={p} isAdmin={isAdmin} onRegistrar={() => setModalPartida(p)} onRefresh={onRefresh} />
                </Fragment>
              )
            })}
          </div>
        ))}
      </div>
      {modalPartida && <ResultadoModalDuplo partida={modalPartida} onClose={() => setModalPartida(null)} onSaved={() => setModalPartida(null)} registrarResultado={registrarResultado} />}
    </>
  )
}