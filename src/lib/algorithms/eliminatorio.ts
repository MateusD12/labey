export function gerarBracketEliminatorio(participantesIds: string[], torneioId: string) {
  const n = participantesIds.length
  const tamanho = Math.pow(2, Math.ceil(Math.log2(n)))
  const slots = [...participantesIds]
  while (slots.length < tamanho) slots.push('bye')

  const partidas = []
  const totalRounds = Math.log2(tamanho)

  // Round 1 — real participants, byes resolved immediately
  for (let i = 0; i < slots.length; i += 2) {
    const blade2 = slots[i + 1] === 'bye' ? null : slots[i + 1]
    partidas.push({
      torneio_id: torneioId,
      fase: getFaseNome(tamanho, 1),
      numero_rodada: 1,
      posicao_bracket: i / 2,
      blade1_id: slots[i],
      blade2_id: blade2,
      vencedor_id: blade2 === null ? slots[i] : null,
      status: blade2 === null ? 'finalizada' : 'pendente',
    })
  }

  // Pre-generate future rounds (blade slots filled by ResultadoModal as results arrive)
  for (let rodada = 2; rodada <= totalRounds; rodada++) {
    const matchesInRound = tamanho / Math.pow(2, rodada)
    for (let pos = 0; pos < matchesInRound; pos++) {
      partidas.push({
        torneio_id: torneioId,
        fase: getFaseNome(tamanho, rodada),
        numero_rodada: rodada,
        posicao_bracket: pos,
        blade1_id: null,
        blade2_id: null,
        vencedor_id: null,
        status: 'pendente',
      })
    }
  }

  return partidas
}

export function gerarEstruturaBracketVazia(numClassificados: number, torneioId: string) {
  const tamanho = Math.pow(2, Math.ceil(Math.log2(numClassificados)))
  const totalRounds = Math.log2(tamanho)
  const partidas = []
  for (let rodada = 1; rodada <= totalRounds; rodada++) {
    const matchesInRound = tamanho / Math.pow(2, rodada)
    for (let pos = 0; pos < matchesInRound; pos++) {
      partidas.push({
        torneio_id: torneioId,
        fase: getFaseNome(tamanho, rodada),
        numero_rodada: rodada,
        posicao_bracket: pos,
        blade1_id: null,
        blade2_id: null,
        vencedor_id: null,
        status: 'pendente',
      })
    }
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
