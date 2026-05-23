import type { EstatisticasBlade } from '@/types'
import { Trophy, Swords, Shield } from 'lucide-react'

export function EstatisticasCard({ stats }: { stats: EstatisticasBlade }) {
  const items = [
    { label: 'Torneios', value: stats.torneios_jogados, icon: <Shield size={16} />, color: 'var(--color-blue-light)' },
    { label: 'Vitórias', value: stats.total_vitorias, icon: <Swords size={16} />, color: 'var(--color-success)' },
    { label: 'Derrotas', value: stats.total_derrotas, icon: <Swords size={16} />, color: 'var(--color-danger)' },
    { label: 'Títulos', value: stats.titulos, icon: <Trophy size={16} />, color: 'var(--color-gold)' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {items.map(item => (
        <div key={item.label} className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ color: item.color, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
          <div style={{ fontFamily: 'Rajdhani', fontSize: '28px', fontWeight: 700, color: item.color }}>{item.value}</div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '12px', color: 'var(--color-text-muted)' }}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}
