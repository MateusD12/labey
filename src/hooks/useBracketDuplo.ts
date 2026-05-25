// ─────────────────────────────────────────────────────────────────────────────
// useBracketDuplo.ts — Business logic hook for Double Elimination
//
// Exposes:
//   registrarResultado(partida, vencedorId, score1?, score2?) → Promise<void>
//
// Routing rules implemented:
//   WB match  → winner advances in WB (or to GF1 blade1 if WB Final)
//             → loser drops to correct LB round (if real match, not a bye)
//   LB match  → winner advances in LB (or to GF1 blade2 if LB Final)
//             → loser is eliminated (no routing)
//   GF1       → if WB champ wins: tournament over (GF2 stays inactive)
//             → if LB champ wins: BRACKET RESET → activate GF2 with both players
//   GF2       → winner is tournament champion (no further routing)
//
// Bye cascade:
//   When routing a player to a slot, if the OTHER slot in that match is still
//   null, it means the opponent never arrived (cascade of WB byes in LB).
//   The match is auto-finalised for the arriving player, and routing continues
//   recursively to the next round — preserving bracket integrity.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Partida } from '@/types'
import {
  getK,
  wbWinnerTarget,
  wbLoserTarget,
  lbWinnerTarget,
  type RoutingTarget,
} from '@/lib/algorithms/bracketUtils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Options {
  torneioId: string
  partidas: Partida[]
  onRefresh?: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBracketDuplo({ torneioId, partidas, onRefresh }: Options) {
  const k = getK(partidas)
  const lbTotalRounds = Math.max(0, 2 * (k - 1))

  const registrarResultado = useCallback(
    async (
      partida: Partida,
      vencedorId: string,
      score1?: number,
      score2?: number,
    ): Promise<void> => {
      const rodada = partida.numero_rodada ?? 1
      const posicao = partida.posicao_bracket ?? 0
      const perdedorId =
        vencedorId === partida.blade1_id ? partida.blade2_id : partida.blade1_id

      // ── 1. Persist the result on this match ──────────────────────────────
      const { error: saveErr } = await supabase
        .from('partidas')
        .update({
          vencedor_id: vencedorId,
          blade1_score: score1 ?? null,
          blade2_score: score2 ?? null,
          status: 'finalizada',
        })
        .eq('id', partida.id)

      if (saveErr) {
        console.error('[useBracketDuplo] save error', saveErr)
        return
      }

      // ── 2. Route based on which bracket phase this match is in ───────────
      if (partida.fase === 'winners') {
        // Route WINNER forward in WB (or to GF1)
        const winTarget = wbWinnerTarget(rodada, posicao, k)
        await routePlayer(torneioId, winTarget, vencedorId, k, lbTotalRounds)

        // Route LOSER to LB — only if there was a real opponent (not a bye)
        if (perdedorId) {
          const loseTarget = wbLoserTarget(rodada, posicao)
          await routePlayer(torneioId, loseTarget, perdedorId, k, lbTotalRounds)
        }

      } else if (partida.fase === 'losers') {
        // Route WINNER through LB (or to GF1 blade2 if LB Final)
        const winTarget = lbWinnerTarget(rodada, posicao, lbTotalRounds)
        await routePlayer(torneioId, winTarget, vencedorId, k, lbTotalRounds)
        // Loser is eliminated — no routing

      } else if (partida.fase === 'grand_final' && rodada === 1) {
        // ── Grand Final 1 ────────────────────────────────────────────────
        const wbChampId = partida.blade1_id  // always WB champ in blade1
        const lbChampId = partida.blade2_id  // always LB champ in blade2

        if (vencedorId === lbChampId) {
          // LB champ upsets WB champ → BRACKET RESET
          // Both players now have exactly 1 loss → activate GF2
          const { error: resetErr } = await supabase
            .from('partidas')
            .update({
              blade1_id: wbChampId,  // WB champ enters as blade1 (1 loss)
              blade2_id: lbChampId,  // LB champ enters as blade2 (1 loss)
              status: 'pendente',
            })
            .eq('torneio_id', torneioId)
            .eq('fase', 'grand_final')
            .eq('numero_rodada', 2)
            .eq('posicao_bracket', 0)

          if (resetErr) console.error('[useBracketDuplo] GF2 activation error', resetErr)
        }
        // If WB champ wins GF1 → tournament over, GF2 stays inactive (both null)
      }
      // GF2 winner: tournament champion — no further routing

      onRefresh?.()
    },
    [torneioId, k, lbTotalRounds, onRefresh],
  )

  return { registrarResultado, k, lbTotalRounds }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Place `playerId` into the target match slot.
 *
 * After placement, checks if the other slot is still null (bye cascade):
 *   • If yes → auto-finalise that match and continue routing the player forward.
 *   • If no  → done; the match now has two players and awaits a real result.
 */
async function routePlayer(
  torneioId: string,
  target: RoutingTarget,
  playerId: string,
  k: number,
  lbTotalRounds: number,
  depth = 0,
): Promise<void> {
  // Safety: prevent runaway recursion (depth > total possible rounds)
  if (depth > k * 3) {
    console.error('[useBracketDuplo] routePlayer: max depth exceeded', { target, playerId })
    return
  }

  // Fetch current state of the target match
  const { data: match, error: fetchErr } = await supabase
    .from('partidas')
    .select('id, blade1_id, blade2_id, fase, numero_rodada, posicao_bracket')
    .eq('torneio_id', torneioId)
    .eq('fase', target.fase)
    .eq('numero_rodada', target.numero_rodada)
    .eq('posicao_bracket', target.posicao_bracket)
    .single()

  if (fetchErr || !match) {
    console.error('[useBracketDuplo] routePlayer: target match not found', target, fetchErr)
    return
  }

  // Write the player into the designated slot
  const { error: updateErr } = await supabase
    .from('partidas')
    .update({ [target.slot]: playerId })
    .eq('id', match.id)

  if (updateErr) {
    console.error('[useBracketDuplo] routePlayer: update error', updateErr)
    return
  }

  // Determine if the other slot is still empty → bye cascade
  const otherSlotValue =
    target.slot === 'blade1_id' ? match.blade2_id : match.blade1_id

  if (otherSlotValue === null) {
    // No opponent → auto-finalise this match and keep routing the player
    await supabase
      .from('partidas')
      .update({ vencedor_id: playerId, status: 'finalizada' })
      .eq('id', match.id)

    const rodada = match.numero_rodada as number
    const posicao = match.posicao_bracket as number
    const fase = match.fase as 'winners' | 'losers' | 'grand_final'

    let nextTarget: RoutingTarget | null = null
    if (fase === 'winners') {
      nextTarget = wbWinnerTarget(rodada, posicao, k)
    } else if (fase === 'losers') {
      nextTarget = lbWinnerTarget(rodada, posicao, lbTotalRounds)
    }
    // grand_final byes shouldn't happen, so no else needed

    if (nextTarget) {
      await routePlayer(torneioId, nextTarget, playerId, k, lbTotalRounds, depth + 1)
    }
  }
  // If other slot is already filled → real match ready, nothing more to do
}
