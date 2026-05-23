import type { Partida, Inscricao } from '@/types'

export interface ClassificacaoGrupo {
  blade_id: string
  grupo: string
  pontos: number
  vitorias: number
  empates: number
  derrotas: number
  gp: number
  gc: number
  saldo: number
}

export function distribuirEmGrupos(inscricoes: Inscricao[], numGrupos: number): Inscricao[] {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return inscricoes.map((ins, i) => ({ ...ins, grupo: letras[i % numGrupos] }))
}

export function gerarPartidasGrupos(inscricoes: Inscricao[], torneioId: string): Omit<Partida, 'id'>[] {
  const grupos = new Map<string, Inscricao[]>()
  for (const ins of inscricoes) {
    if (!ins.grupo) continue
    if (!grupos.has(ins.grupo)) grupos.set(ins.grupo, [])
    grupos.get(ins.grupo)!.push(ins)
  }

  const partidas: Omit<Partida, 'id'>[] = []
  for (const [grupo, membros] of grupos) {
    for (let i = 0; i < membros.length; i++) {
      for (let j = i + 1; j < membros.length; j++) {
        partidas.push({
          torneio_id: torneioId,
          fase: 'grupos',
          grupo,
          blade1_id: membros[i].blade_id,
          blade2_id: membros[j].blade_id,
          status: 'pendente',
        } as Omit<Partida, 'id'>)
      }
    }
  }
  return partidas
}

export function calcularClassificacaoGrupo(
  partidas: Partida[],
  pontos: { vitoria: number; empate: number; derrota: number }
): Map<string, ClassificacaoGrupo> {
  const classificacao = new Map<string, ClassificacaoGrupo>()

  const get = (id: string, grupo: string) => {
    if (!classificacao.has(id)) {
      classificacao.set(id, { blade_id: id, grupo, pontos: 0, vitorias: 0, empates: 0, derrotas: 0, gp: 0, gc: 0, saldo: 0 })
    }
    return classificacao.get(id)!
  }

  for (const p of partidas) {
    if (p.status !== 'finalizada' || !p.blade1_id || !p.blade2_id) continue
    const g = p.grupo || ''
    const b1 = get(p.blade1_id, g)
    const b2 = get(p.blade2_id, g)
    b1.gp += p.blade1_score ?? 0; b1.gc += p.blade2_score ?? 0
    b2.gp += p.blade2_score ?? 0; b2.gc += p.blade1_score ?? 0

    if (p.vencedor_id === p.blade1_id) {
      b1.vitorias++; b1.pontos += pontos.vitoria
      b2.derrotas++; b2.pontos += pontos.derrota
    } else if (p.vencedor_id === p.blade2_id) {
      b2.vitorias++; b2.pontos += pontos.vitoria
      b1.derrotas++; b1.pontos += pontos.derrota
    } else {
      b1.empates++; b1.pontos += pontos.empate
      b2.empates++; b2.pontos += pontos.empate
    }
  }

  classificacao.forEach(e => { e.saldo = e.gp - e.gc })
  return classificacao
}
