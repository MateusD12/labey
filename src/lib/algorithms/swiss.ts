import type { Partida } from '@/types'

interface Participante {
  id: string
  pontos: number
  adversarios: string[]
}

export function gerarRodadaSuica(
  participantes: Participante[],
  rodadaAtual: number,
  torneioId: string
): Omit<Partida, 'id' | 'created_at' | 'updated_at'>[] {
  const ordenados = [...participantes].sort((a, b) => b.pontos - a.pontos)
  const partidas: Omit<Partida, 'id' | 'created_at' | 'updated_at'>[] = []
  const emparelhados = new Set<string>()

  for (let i = 0; i < ordenados.length; i++) {
    if (emparelhados.has(ordenados[i].id)) continue
    for (let j = i + 1; j < ordenados.length; j++) {
      if (emparelhados.has(ordenados[j].id)) continue
      if (ordenados[i].adversarios.includes(ordenados[j].id)) continue

      partidas.push({
        torneio_id: torneioId,
        fase: 'rodada_suica',
        numero_rodada: rodadaAtual,
        blade1_id: ordenados[i].id,
        blade2_id: ordenados[j].id,
        status: 'pendente',
      } as Omit<Partida, 'id'>)

      emparelhados.add(ordenados[i].id)
      emparelhados.add(ordenados[j].id)
      break
    }
  }

  const semPar = ordenados.find(p => !emparelhados.has(p.id))
  if (semPar) {
    partidas.push({
      torneio_id: torneioId,
      fase: 'rodada_suica',
      numero_rodada: rodadaAtual,
      blade1_id: semPar.id,
      blade2_id: undefined,
      vencedor_id: semPar.id,
      status: 'finalizada',
      observacoes: 'BYE - vitória automática',
    } as Omit<Partida, 'id'>)
  }

  return partidas
}
