import type { ComboPart, SystemName } from '@/types'
import { PartCard } from './PartCard'
import { buildComboName } from '@/lib/algorithms/combos'

interface ComboDisplayProps {
  system: SystemName
  parts: ComboPart[]
  label?: string
}

const SYSTEM_COLOR: Record<SystemName, string> = {
  'BX/UX': '#3b82f6',
  'CX': '#8b5cf6',
  'CX Expend': '#ec4899',
}

export function ComboDisplay({ system, parts, label }: ComboDisplayProps) {
  const color = SYSTEM_COLOR[system]
  const name = buildComboName(system, parts)

  return (
    <div style={{
      border: `1px solid ${color}44`,
      borderRadius: 12,
      padding: '16px',
      background: 'var(--color-bg-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {label && (
          <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {label}
          </span>
        )}
        <span style={{
          background: `${color}22`, color, fontFamily: 'DM Sans',
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em',
        }}>
          {system}
        </span>
      </div>

      <div style={{
        fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15,
        color: 'var(--color-text-primary)', marginBottom: 14,
        letterSpacing: '0.01em',
      }}>
        {name}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {parts.map((p, i) => (
          <PartCard key={`${p.id ?? p.peca}-${i}`} part={p} compact />
        ))}
      </div>
    </div>
  )
}
