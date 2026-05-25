// ─────────────────────────────────────────────────────────────────────────────
// duplo.ts — Double Elimination bracket generator (v2)
//
// Fixes over v1:
//  1. Correct seeding: top seeds receive byes (nulls interspersed, not appended)
//  2. Bye matches are auto-finalised at generation time (status='finalizada',
//     vencedor_id set) so the UI never shows a "pending" match with no opponent.
//  3. Bye winners are pre-filled into their WB R2 slots immediately.
//  4. LB match counts use the validated formula: max(1, 2^(k−⌈lbr/2⌉−1))
//  5. Grand Final: GF1 (mandatory) + GF2 (bracket reset slot, always generated)
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum shape required for a generated partida record */
export interface PartidaDuploInput {
  torneio_id: string
  fase: 'winners' | 'losers' | 'grand_final'
  numero_rodada: number
  posicao_bracket: number
  blade1_id: string | null
  blade2_id: string | null
  vencedor_id: string | null
  status: 'pendente' | 'finalizada'
}

// ── Internal seeding helper ───────────────────────────────────────────────────

/**
 * Build a slotCount-length array where:
 *  - Top `byes` seeds each get paired with a null (bye) in positions 0..byes-1
 *  - Remaining seeds (byes..n-1) fill the rest of the pairs in a
 *    "top-vs-bottom" cross so that if there are no byes the bracket is
 *    seeded 1v(n/2+1), 2v(n/2+2), ... (standard folded seeding).
 *
 * Example n=6, slotCount=8, byes=2:
 *   [S1, null, S2, null, S3, S6, S4, S5]
 *   Pairs: (S1,bye), (S2,bye), (S3 vs S6), (S4 vs S5)
 */
function buildSeededSlots(playerIds: string[], slotCount: number): (string | null)[] {
  const n = playerIds.length
  const byes = slotCount - n
  const halfSlot = slotCount / 2          // number of first-round match-pairs
  const slots: (string | null)[] = new Array(slotCount).fill(null)

  let topPtr = 0          // advances from seed 1 upward
  let botPtr = n - 1      // advances from seed n downward

  for (let pair = 0; pair < halfSlot; pair++) {
    if (pair < byes) {
      // Top seed gets a bye in this pair
      slots[pair * 2] = playerIds[topPtr++]
      slots[pair * 2 + 1] = null
    } else {
      // Real match: top remaining seed vs bottom remaining seed
      slots[pair * 2] = playerIds[topPtr++]
      slots[pair * 2 + 1] = playerIds[botPtr--]
    }
  }

  return slots
}

// ── Main generator ────────────────────────────────────────────────────────────

/**
 * Generate all partidas for a Double Elimination tournament.
 *
 * @param playerIds  Ordered list of participant IDs (index 0 = seed 1)
 * @param torneioId  Tournament UUID
 * @returns Array of partida objects ready for Supabase insert
 */
export function gerarBracketDuplo(
  playerIds: string[],
  torneioId: string,
): PartidaDuploInput[] {
  const n = playerIds.length
  if (n < 2) return []

  const k = Math.ceil(Math.log2(Math.max(n, 2)))   // WB round count
  const slotCount = Math.pow(2, k)                  // next power-of-2 ≥ n
  const lbTotalRounds = 2 * (k - 1)                 // LB round count

  const slots = buildSeededSlots(playerIds, slotCount)
  const partidas: PartidaDuploInput[] = []

  // ── WB Round 1 ────────────────────────────────────────────────────────────
  // Track which WB R2 slots are pre-filled by bye auto-advances
  const r2Prefill: Record<number, Partial<Record<'blade1_id' | 'blade2_id', string>>> = {}

  for (let i = 0; i < slotCount; i += 2) {
    const p1 = slots[i]
    const p2 = slots[i + 1]
    const matchPos = i / 2

    if (!p1 && !p2) {
      // Double-bye position — skip entirely (no match generated)
      continue
    }

    if (p1 && !p2) {
      // Single bye: p1 wins automatically
      partidas.push({
        torneio_id: torneioId,
        fase: 'winners',
        numero_rodada: 1,
        posicao_bracket: matchPos,
        blade1_id: p1,
        blade2_id: null,
        vencedor_id: p1,   // ← auto-winner
        status: 'finalizada',
      })

      // Pre-fill the WB R2 slot this bye-winner feeds into
      const r2Pos = Math.floor(matchPos / 2)
      const r2Slot: 'blade1_id' | 'blade2_id' = matchPos % 2 === 0 ? 'blade1_id' : 'blade2_id'
      if (!r2Prefill[r2Pos]) r2Prefill[r2Pos] = {}
      r2Prefill[r2Pos][r2Slot] = p1

    } else {
      // Normal competitive match
      partidas.push({
        torneio_id: torneioId,
        fase: 'winners',
        numero_rodada: 1,
        posicao_bracket: matchPos,
        blade1_id: p1,
        blade2_id: p2!,
        vencedor_id: null,
        status: 'pendente',
      })
    }
  }

  // ── WB Rounds 2 .. k ──────────────────────────────────────────────────────
  for (let r = 2; r <= k; r++) {
    const matchCount = Math.pow(2, k - r)
    for (let pos = 0; pos < matchCount; pos++) {
      const prefill = r === 2 ? r2Prefill[pos] : undefined
      partidas.push({
        torneio_id: torneioId,
        fase: 'winners',
        numero_rodada: r,
        posicao_bracket: pos,
        blade1_id: prefill?.blade1_id ?? null,
        blade2_id: prefill?.blade2_id ?? null,
        vencedor_id: null,
        status: 'pendente',
      })
    }
  }

  // ── LB Rounds 1 .. 2*(k-1) ───────────────────────────────────────────────
  // Match count formula (validated for k=2,3,4,5):
  //   mc = max(1, 2^(k − ⌈lbr/2⌉ − 1))
  //
  // Structure alternates:
  //   Odd  LBR → consolidation (LB survivors play each other, no WB drops)
  //   Even LBR → drop round    (WB losers enter as blade2, LB survivors as blade1)
  for (let lbr = 1; lbr <= lbTotalRounds; lbr++) {
    const mc = Math.max(1, Math.pow(2, k - Math.ceil(lbr / 2) - 1))
    for (let pos = 0; pos < mc; pos++) {
      partidas.push({
        torneio_id: torneioId,
        fase: 'losers',
        numero_rodada: lbr,
        posicao_bracket: pos,
        blade1_id: null,
        blade2_id: null,
        vencedor_id: null,
        status: 'pendente',
      })
    }
  }

  // ── Grand Final ───────────────────────────────────────────────────────────
  // GF1 — mandatory: WB champ (blade1, 0 losses) vs LB champ (blade2, 1 loss)
  partidas.push({
    torneio_id: torneioId,
    fase: 'grand_final',
    numero_rodada: 1,
    posicao_bracket: 0,
    blade1_id: null,
    blade2_id: null,
    vencedor_id: null,
    status: 'pendente',
  })

  // GF2 — bracket reset: pre-generated but stays inactive until LB champ
  // wins GF1. At that point both players have exactly 1 loss → decisive rematch.
  // The useBracketDuplo hook activates this by setting blade1/blade2 + status.
  partidas.push({
    torneio_id: torneioId,
    fase: 'grand_final',
    numero_rodada: 2,
    posicao_bracket: 0,
    blade1_id: null,
    blade2_id: null,
    vencedor_id: null,
    status: 'pendente',
  })

  return partidas
}
