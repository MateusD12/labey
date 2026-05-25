// ─────────────────────────────────────────────────────────────────────────────
// bracketUtils.ts — Pure routing math for Double Elimination brackets
//
// Convention (k = total WB rounds = ceil(log2(n))):
//   lbTotalRounds = 2 * (k - 1)
//
//   WB Rj losers routing:
//     WB R1 → LBR1 (odd, initial consolidation)
//     WB Rj (j ≥ 2) → LBR(2j-2) (even, drop round), same posicao, slot blade2
//
//   LB winner routing:
//     Odd LBR (consolidation) → next even LBR (drop): same posicao, blade1
//     Even LBR (drop) → next odd LBR (consolidation): floor(pos/2), alternating slot
//     LB Final winner → GF1 blade2
//
//   WB winner routing:
//     WB Rj (j < k) → WB R(j+1): floor(pos/2), alternating slot
//     WB Final (j = k) winner → GF1 blade1
//
// Match count per LB round lbr: max(1, 2^(k - ceil(lbr/2) - 1))
// ─────────────────────────────────────────────────────────────────────────────

export type BracketSlot = 'blade1_id' | 'blade2_id'
export type BracketFase = 'winners' | 'losers' | 'grand_final'

export interface RoutingTarget {
  fase: BracketFase
  numero_rodada: number
  posicao_bracket: number
  slot: BracketSlot
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Derive k from the max WB numero_rodada found in partidas */
export function getK(partidas: { fase: string; numero_rodada?: number | null }[]): number {
  const rodadas = partidas
    .filter(p => p.fase === 'winners')
    .map(p => p.numero_rodada ?? 0)
  return rodadas.length > 0 ? Math.max(...rodadas) : 0
}

// ── WB routing ───────────────────────────────────────────────────────────────

/**
 * Where does the WINNER of a WB match go?
 * @param rodada  1-indexed WB round (1 = first round)
 * @param posicao match position within that round (0-indexed)
 * @param k       total WB rounds
 */
export function wbWinnerTarget(
  rodada: number,
  posicao: number,
  k: number,
): RoutingTarget {
  if (rodada < k) {
    return {
      fase: 'winners',
      numero_rodada: rodada + 1,
      posicao_bracket: Math.floor(posicao / 2),
      slot: posicao % 2 === 0 ? 'blade1_id' : 'blade2_id',
    }
  }
  // WB Final winner → Grand Final match 1, upper slot
  return { fase: 'grand_final', numero_rodada: 1, posicao_bracket: 0, slot: 'blade1_id' }
}

/**
 * Where does the LOSER of a WB match go in the LB?
 * Returns null for bye matches (no real loser).
 * @param rodada  1-indexed WB round
 * @param posicao match position within that round (0-indexed)
 */
export function wbLoserTarget(
  rodada: number,
  posicao: number,
): RoutingTarget {
  if (rodada === 1) {
    // WB R1 losers → LBR1 (odd, consolidation)
    // Pairs: (pos0,pos1) → LBR1 pos 0 ; (pos2,pos3) → LBR1 pos 1 ; etc.
    return {
      fase: 'losers',
      numero_rodada: 1,
      posicao_bracket: Math.floor(posicao / 2),
      slot: posicao % 2 === 0 ? 'blade1_id' : 'blade2_id',
    }
  }
  // WB Rj (j ≥ 2) losers → LBR(2j-2) (even, drop round)
  // WB Rj has same match count as LBR(2j-2), so posicao maps 1:1.
  // WB loser always enters as blade2 (LB survivor occupies blade1 in drop rounds).
  return {
    fase: 'losers',
    numero_rodada: 2 * (rodada - 1),
    posicao_bracket: posicao,
    slot: 'blade2_id',
  }
}

// ── LB routing ───────────────────────────────────────────────────────────────

/**
 * Where does the WINNER of an LB match go?
 * @param rodada        1-indexed LB round
 * @param posicao       match position within that round (0-indexed)
 * @param lbTotalRounds 2 * (k - 1)
 */
export function lbWinnerTarget(
  rodada: number,
  posicao: number,
  lbTotalRounds: number,
): RoutingTarget {
  if (rodada === lbTotalRounds) {
    // LB Final winner → Grand Final match 1, lower slot
    return { fase: 'grand_final', numero_rodada: 1, posicao_bracket: 0, slot: 'blade2_id' }
  }

  if (rodada % 2 === 1) {
    // Odd LBR (consolidation) → next round is even (drop):
    // LB survivors keep the same position and enter as blade1.
    return {
      fase: 'losers',
      numero_rodada: rodada + 1,
      posicao_bracket: posicao,
      slot: 'blade1_id',
    }
  }

  // Even LBR (drop) → next round is odd (consolidation):
  // Match count halves → floor(pos/2), alternating slot.
  return {
    fase: 'losers',
    numero_rodada: rodada + 1,
    posicao_bracket: Math.floor(posicao / 2),
    slot: posicao % 2 === 0 ? 'blade1_id' : 'blade2_id',
  }
}
