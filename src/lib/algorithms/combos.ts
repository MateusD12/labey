import type { BeybladeRow, ComboPart, SystemName } from '@/types'

export function getImageUrl(row: BeybladeRow): string | null {
  if (row.storage_url) return row.storage_url
  if (row.image_id) return `/images/${row.image_id}.jpeg`
  if (row.peca) return `/images/${row.peca.replace(/[^a-zA-Z0-9 \-_]/g, '').trim()}.jpeg`
  return null
}

function makeRowKey(row: BeybladeRow): string {
  return row.id ? `id:${row.id}` : `b:${row.beyblade}|t:${row.tipo}|p:${row.peca}`
}

function pickOne<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error('Não há peças suficientes para montar o combo.')
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickCombo(
  data: BeybladeRow[],
  excludedIds: Set<string> = new Set(),
): { system: SystemName; parts: ComboPart[] } {
  const excluded = new Set<string>(excludedIds)

  function available(tipos: string | string[]) {
    const list = Array.isArray(tipos) ? tipos : [tipos]
    return data.filter(r => list.includes(r.tipo) && !excluded.has(makeRowKey(r)))
  }

  function pickFrom(tipos: string | string[]): ComboPart {
    const row = pickOne(available(tipos))
    excluded.add(makeRowKey(row))
    return { ...row, imageUrl: getImageUrl(row) }
  }

  function has(tipos: string | string[]) {
    const list = Array.isArray(tipos) ? tipos : [tipos]
    return list.every(t => available(t).length > 0)
  }

  const firstPick = pickFrom(['Blade', 'Assist Blade'])

  if (firstPick.tipo === 'Blade') {
    if (!has(['Ratchet', 'Bit'])) throw new Error('Não há peças suficientes para montar o combo BX/UX.')
    return { system: 'BX/UX', parts: [firstPick, pickFrom('Ratchet'), pickFrom('Bit')] }
  }

  const assistBlade = firstPick
  const canCX = has(['Main Blade', 'Lock Chip', 'Ratchet', 'Bit'])
  const canCXE = has(['Metal Blade', 'Over Blade', 'Lock Chip', 'Ratchet', 'Bit'])

  if (!canCX && !canCXE) throw new Error('Não há blades suficientes para montar o combo CX ou CX Expend.')

  const nextType = canCX && canCXE ? pickOne(['Main Blade', 'Metal Blade']) : canCX ? 'Main Blade' : 'Metal Blade'

  if (nextType === 'Main Blade') {
    return {
      system: 'CX',
      parts: [pickFrom('Lock Chip'), pickFrom('Main Blade'), assistBlade, pickFrom('Ratchet'), pickFrom('Bit')],
    }
  }

  return {
    system: 'CX Expend',
    parts: [pickFrom('Lock Chip'), pickFrom('Over Blade'), pickFrom('Metal Blade'), assistBlade, pickFrom('Ratchet'), pickFrom('Bit')],
  }
}

export function buildComboName(system: SystemName, parts: ComboPart[]): string {
  if (system === 'BX/UX') return `${parts[0].peca} ${parts[1].peca} ${parts[2].peca}`
  if (system === 'CX') return `${parts[0].peca}${parts[1].peca} ${parts[2].peca} ${parts[3].peca} ${parts[4].peca}`
  return `${parts[0].peca}${parts[1].peca}${parts[2].peca} ${parts[3].peca} ${parts[4].peca} ${parts[5].peca}`
}
