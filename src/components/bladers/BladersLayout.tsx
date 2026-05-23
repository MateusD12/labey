import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { EstatisticasBlade } from '@/types'
import { Search } from 'lucide-react'

interface RankingInfo { posicao: number; pontos: number }
interface Props { bladers: EstatisticasBlade[]; rankingMap: Record<string, RankingInfo> }

const SORT_OPTS = [
  { value: 'vitorias',  label: 'Vitórias' },
  { value: 'winrate',   label: 'Winrate' },
  { value: 'torneios',  label: 'Torneios' },
  { value: 'titulos',   label: 'Títulos' },
  { value: 'ranking',   label: 'Ranking' },
]

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function winrate(b: EstatisticasBlade) {
  const total = b.total_vitorias + b.total_derrotas
  return total === 0 ? 0 : Math.round((b.total_vitorias / total) * 100)
}

function Avatar({ b }: { b: EstatisticasBlade }) {
  if (b.avatar_url) {
    return <img src={b.avatar_url} alt={b.nome_display} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }} />
  }
  const initials = b.nome_display?.slice(0, 2).toUpperCase() ?? b.username?.slice(0, 2).toUpperCase() ?? '??'
  const hue = [...(b.username ?? '')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div style={{ width: 72, height: 72, borderRadius: '50%', background: `hsl(${hue}, 55%, 28%)`, border: `2px solid hsl(${hue}, 55%, 40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 24, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function BladerCard({ b, rankingInfo }: { b: EstatisticasBlade; rankingInfo?: RankingInfo }) {
  const wr = winrate(b)
  const total = b.total_vitorias + b.total_derrotas
  return (
    <Link to={`/perfil/${b.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color 0.15s, transform 0.15s', cursor: 'pointer', height: '100%' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-blue-primary)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar b={b} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Rajdhani', fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>{b.nome_display}</span>
              {b.titulos > 0 && <span title={`${b.titulos} título${b.titulos > 1 ? 's' : ''}`} style={{ fontSize: 14 }}>{b.titulos >= 3 ? '🏆🏆🏆' : b.titulos === 2 ? '🏆🏆' : '🏆'}</span>}
            </div>
            <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>@{b.username}</span>
            {rankingInfo && (
              <div style={{ marginTop: 4 }}>
                <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, background: 'rgba(43,91,232,0.15)', color: 'var(--color-blue-light)', padding: '1px 8px', borderRadius: 10 }}>
                  {MEDAL[rankingInfo.posicao] ?? `#${rankingInfo.posicao}`} · {rankingInfo.pontos} pts
                </span>
              </div>
            )}
          </div>
        </div>
        {total > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-success)', fontWeight: 600 }}>{b.total_vitorias}V</span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: wr >= 60 ? 'var(--color-success)' : wr >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>{wr}% WR</span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}>{b.total_derrotas}D</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${wr}%`, borderRadius: 3, background: wr >= 60 ? 'linear-gradient(90deg, var(--color-blue-primary), var(--color-success))' : wr >= 40 ? 'linear-gradient(90deg, var(--color-blue-primary), var(--color-warning))' : 'var(--color-danger)', transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
          {[
            { label: 'Torneios', value: b.torneios_jogados, color: 'var(--color-blue-light)' },
            { label: 'Vitórias', value: b.total_vitorias, color: 'var(--color-success)' },
            { label: 'Derrotas', value: b.total_derrotas, color: 'var(--color-danger)' },
            { label: 'Títulos', value: b.titulos, color: '#FFD700' },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
              <div style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}

export function BladersLayout({ bladers, rankingMap }: Props) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<string>('vitorias')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const list = q ? bladers.filter(b => b.nome_display?.toLowerCase().includes(q) || b.username?.toLowerCase().includes(q)) : bladers
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'winrate':  return winrate(b) - winrate(a)
        case 'torneios': return b.torneios_jogados - a.torneios_jogados
        case 'titulos':  return b.titulos - a.titulos
        case 'ranking': { const ra = rankingMap[a.id]?.posicao ?? 9999; const rb = rankingMap[b.id]?.posicao ?? 9999; return ra - rb }
        default:         return b.total_vitorias - a.total_vitorias
      }
    })
  }, [bladers, query, sort, rankingMap])

  const active     = bladers.filter(b => b.torneios_jogados > 0)
  const withTitles = bladers.filter(b => b.titulos > 0)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Rajdhani', fontSize: 32, fontWeight: 700, margin: 0 }}>Bladers</h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            {bladers.length} participantes cadastrados · {active.length} ativos · {withTitles.length} campeões
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {SORT_OPTS.map(opt => (
              <button key={opt.value} onClick={() => setSort(opt.value)} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, background: sort === opt.value ? 'var(--color-blue-primary)' : 'var(--color-bg-secondary)', color: sort === opt.value ? '#fff' : 'var(--color-text-muted)', outline: sort === opt.value ? 'none' : '1px solid var(--color-border)', transition: 'all 0.15s' }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Buscar blader..." value={query} onChange={e => setQuery(e.target.value)} style={{ padding: '8px 12px 8px 30px', borderRadius: 20, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none', width: 180 }} />
          </div>
        </div>
      </div>

      {sort === 'ranking' && filtered.slice(0, 3).some(b => rankingMap[b.id]) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
          {filtered.slice(0, 3).map((b, i) => {
            const ri = rankingMap[b.id]
            if (!ri) return null
            const heights = [100, 80, 65]
            const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32']
            return (
              <Link key={b.id} to={`/perfil/${b.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Avatar b={b} />
                <div style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{b.nome_display}</div>
                <div style={{ fontFamily: 'Rajdhani', fontSize: 13, color: podiumColors[i] }}>{ri.pontos} pts</div>
                <div style={{ width: 80, borderRadius: '6px 6px 0 0', height: heights[i], background: `${podiumColors[i]}22`, border: `1px solid ${podiumColors[i]}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani', fontSize: 28, fontWeight: 700, color: podiumColors[i] }}>{i + 1}</div>
              </Link>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Nenhum blader encontrado para "{query}"</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(b => <BladerCard key={b.id} b={b} rankingInfo={rankingMap[b.id]} />)}
        </div>
      )}
    </div>
  )
}
