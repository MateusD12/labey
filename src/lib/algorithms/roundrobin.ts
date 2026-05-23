import type { Partida } from '@/types'

export function gerarPartidasRoundRobin(participantesIds: string[], torneioId: string): Omit<Partida, 'id'>[] {
  const partidas: Omit<Partida, 'id'>[] = []
  const ids = [...participantesIds]
  if (ids.length % 2 !== 0) ids.push('bye')

  const n = ids.length
  const rodadas = n - 1

  for (let rodada = 0; rodada < rodadas; rodada++) {
    for (let i = 0; i < n / 2; i++) {
      const b1 = ids[i]
      const b2 = ids[n - 1 - i]
      if (b1 === 'bye' || b2 === 'bye') continue
      partidas.push({
        torneio_id: torneioId,
        fase: 'round_robin',
        numero_rodada: rodada + 1,
        blade1_id: b1,
        blade2_id: b2,
        status: 'pendente',
      } as Omit<Partida, 'id'>)
    }
    const ultimo = ids.pop()!
    ids.splice(1, 0, ultimo)
  }
  return partidas
}
