import { supabase } from '@/lib/supabase'
import type { Partida } from '@/types'

export async function anularResultado(partida: Partida): Promise<void> {
  const vencedorAnterior = partida.vencedor_id

  await supabase.from('partidas').update({
    status: 'pendente',
    vencedor_id: null,
    blade1_score: null,
    blade2_score: null,
  }).eq('id', partida.id)

  // Para bracket eliminatório: remover o vencedor do próximo slot
  if (
    vencedorAnterior &&
    partida.numero_rodada &&
    partida.posicao_bracket !== null &&
    partida.posicao_bracket !== undefined
  ) {
    const nextRodada = partida.numero_rodada + 1
    const nextPos = Math.floor(partida.posicao_bracket / 2)
    const slot = partida.posicao_bracket % 2 === 0 ? 'blade1_id' : 'blade2_id'
    await supabase
      .from('partidas')
      .update({ [slot]: null })
      .eq('torneio_id', partida.torneio_id)
      .eq('numero_rodada', nextRodada)
      .eq('posicao_bracket', nextPos)
  }
}
