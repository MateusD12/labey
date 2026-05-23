import type { EstatisticasBlade } from '@/types'

interface Badge {
  id: string
  emoji: string
  label: string
  desc: string
  color: string
}

function getBadges(stats: EstatisticasBlade): Badge[] {
  const badges: Badge[] = []

  if (stats.titulos >= 1)
    badges.push({ id: 'campeao', emoji: '🏆', label: 'Campeão', desc: `${stats.titulos} título${stats.titulos > 1 ? 's' : ''}`, color: '#f59e0b' })

  if (stats.torneios_jogados >= 1)
    badges.push({ id: 'estreante', emoji: '⚡', label: 'Estreante', desc: 'Primeiro torneio', color: '#3b82f6' })

  if (stats.torneios_jogados >= 5)
    badges.push({ id: 'veterano', emoji: '🛡️', label: 'Veterano', desc: '5+ torneios', color: '#8b5cf6' })

  if (stats.torneios_jogados >= 10)
    badges.push({ id: 'lendario', emoji: '👑', label: 'Lendário', desc: '10+ torneios', color: '#ec4899' })

  if (stats.total_vitorias >= 10)
    badges.push({ id: 'chamas', emoji: '🔥', label: 'Em Chamas', desc: '10+ vitórias', color: '#ef4444' })

  if (stats.total_vitorias >= 25)
    badges.push({ id: 'imparavel', emoji: '💀', label: 'Imparável', desc: '25+ vitórias', color: '#6366f1' })

  const total = stats.total_vitorias + stats.total_derrotas
  if (total >= 10 && stats.total_vitorias / total >= 0.7)
    badges.push({ id: 'dominante', emoji: '⚔️', label: 'Dominante', desc: '70%+ WR (min. 10 jogos)', color: '#10b981' })

  return badges
}

export function Badges({ stats }: { stats: EstatisticasBlade }) {
  const badges = getBadges(stats)
  if (!badges.length) return null

  return (
    <div className="card">
      <p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 12, marginBottom: 12 }}>Conquistas</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {badges.map(b => (
          <div key={b.id} title={b.desc} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: `${b.color}18`, border: `1px solid ${b.color}44`,
            borderRadius: 8, padding: '6px 12px',
          }}>
            <span style={{ fontSize: 16 }}>{b.emoji}</span>
            <div>
              <div style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 700, color: b.color }}>{b.label}</div>
              <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: 'var(--color-text-muted)' }}>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
