export function gerarBracketEliminatorio(participantesIds: string[], torneioId: string) {
  const n = participantesIds.length
  const tamanho = Math.pow(2, Math.ceil(Math.log2(n)))
  const slots = [...participantesIds]
  while (slots.length < tamanho) slots.push('bye')

  const partidas = []
  let posicao = 0

  for (let i = 0; i < slots.length; i += 2) {
    const blade2 = slots[i + 1] === 'bye' ? null : slots[i + 1]
    partidas.push({
      torneio_id: torneioId,
      fase: 'rodada_1',
      posicao_bracket: posicao++,
      blade1_id: slots[i],
      blade2_id: blade2,
      vencedor_id: blade2 === null ? slots[i] : null,
      status: blade2 === null ? 'finalizada' : 'pendente',
    })
  }
  return partidas
}

export function getFaseNome(totalParticipantes: number, rodada: number): string {
  const fases: Record<number, string> = {
    2: 'final',
    4: 'semi',
    8: 'quartas',
    16: 'oitavas',
    32: 'decasseis',
  }
  const participantesNaFase = totalParticipantes / Math.pow(2, rodada - 1)
  return fases[participantesNaFase] || `rodada_${rodada}`
}
