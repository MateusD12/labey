// Double Elimination bracket generator
// WB: k rounds (same structure as single elim)
// LB: 2*(k-1) rounds alternating drop/consolidation
// Grand Final: 1 match

export function gerarBracketDuplo(playerIds: string[], torneioId: string) {
  const n = playerIds.length
  if (n < 2) return []

  const k = Math.ceil(Math.log2(Math.max(n, 2)))
  const slotCount = Math.pow(2, k)

  const slots: (string | null)[] = [...playerIds]
  while (slots.length < slotCount) slots.push(null)

  const partidas: any[] = []

  // ── Winners Bracket R1 ──────────────────────────────────
  for (let i = 0; i < slotCount; i += 2) {
    if (!slots[i] && !slots[i + 1]) continue
    partidas.push({
      torneio_id: torneioId,
      fase: 'winners',
      numero_rodada: 1,
      posicao_bracket: i / 2,
      blade1_id: slots[i],
      blade2_id: slots[i + 1],
      status: 'pendente',
    })
  }

  // ── Winners Bracket R2..k (pre-generated empty) ──────────
  for (let r = 2; r <= k; r++) {
    const mc = Math.pow(2, k - r)
    for (let pos = 0; pos < mc; pos++) {
      partidas.push({
        torneio_id: torneioId, fase: 'winners',
        numero_rodada: r, posicao_bracket: pos,
        blade1_id: null, blade2_id: null, status: 'pendente',
      })
    }
  }

  // ── Losers Bracket: 2*(k-1) rounds ───────────────────────
  // Round matchCounts: Math.max(1, 2^(k - ceil(lbr/2) - 1))
  // Odd LBR: WBR1-consolidation or drop round; Even LBR: consolidation
  const lbRounds = 2 * (k - 1)
  for (let lbr = 1; lbr <= lbRounds; lbr++) {
    const mc = Math.max(1, Math.pow(2, k - Math.ceil(lbr / 2) - 1))
    for (let pos = 0; pos < mc; pos++) {
      partidas.push({
        torneio_id: torneioId, fase: 'losers',
        numero_rodada: lbr, posicao_bracket: pos,
        blade1_id: null, blade2_id: null, status: 'pendente',
      })
    }
  }

  // ── Grand Final ───────────────────────────────────────────
  // GF1: mandatory (WB champ vs LB champ)
  partidas.push({
    torneio_id: torneioId, fase: 'grand_final',
    numero_rodada: 1, posicao_bracket: 0,
    blade1_id: null, blade2_id: null, status: 'pendente',
  })
  // GF2 (Bracket Reset): only activated if LB champ wins GF1
  // WB champ had 0 losses; GF1 loss gives them 1 loss → both are tied at 1 loss
  partidas.push({
    torneio_id: torneioId, fase: 'grand_final',
    numero_rodada: 2, posicao_bracket: 0,
    blade1_id: null, blade2_id: null, status: 'pendente',
  })

  return partidas
}
