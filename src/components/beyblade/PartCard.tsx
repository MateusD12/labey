import type { BeybladeRow } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  'Blade': '#3b82f6',
  'Assist Blade': '#8b5cf6',
  'Main Blade': '#a855f7',
  'Metal Blade': '#6366f1',
  'Over Blade': '#ec4899',
  'Lock Chip': '#f59e0b',
  'Ratchet': '#10b981',
  'Bit': '#ef4444',
}

interface PartCardProps {
  part: BeybladeRow & { imageUrl?: string | null }
  compact?: boolean
}

export function PartCard({ part, compact = false }: PartCardProps) {
  const color = TYPE_COLORS[part.tipo] ?? '#6b7280'
  const imgUrl = (part as { imageUrl?: string | null }).imageUrl ?? part.storage_url ?? null
  const size = compact ? 56 : 80

  return (
    <div style={{
      display: 'flex', flexDirection: compact ? 'row' : 'column',
      alignItems: 'center', gap: compact ? 10 : 8,
      background: 'var(--color-bg-secondary)',
      border: `1px solid ${color}33`,
      borderRadius: 10, padding: compact ? '8px 12px' : 12,
      minWidth: compact ? 'auto' : 96,
    }}>
      <div style={{
        width: size, height: size, borderRadius: 8, overflow: 'hidden',
        background: 'var(--color-bg-tertiary)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${color}44`,
      }}>
        {imgUrl
          ? <img src={imgUrl} alt={part.peca} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: compact ? 20 : 28 }}>⚙️</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'inline-block', padding: '1px 7px', borderRadius: 4,
          background: `${color}22`, color, fontSize: 10, fontFamily: 'DM Sans',
          fontWeight: 600, letterSpacing: '0.04em', marginBottom: 3,
          whiteSpace: 'nowrap',
        }}>
          {part.tipo}
        </div>
        <div style={{
          fontFamily: 'Rajdhani', fontWeight: 700,
          fontSize: compact ? 13 : 14, color: 'var(--color-text-primary)',
          lineHeight: 1.2, wordBreak: 'break-word',
        }}>
          {part.peca}
        </div>
        {!compact && (
          <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {part.geracao} · {part.serie}
          </div>
        )}
      </div>
    </div>
  )
}
