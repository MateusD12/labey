import { Link } from 'react-router-dom'
import type { RankingEntrada } from '@/types'

export function CardRanking({ entrada }: { entrada: RankingEntrada }) {
  const medal = entrada.posicao === 1 ? '🥇' : entrada.posicao === 2 ? '🥈' : entrada.posicao === 3 ? '🥉' : null
  return (
    <Link to={`/perfil/${entrada.blade_id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
        <div style={{ fontFamily: 'Rajdhani', fontSize: '24px', fontWeight: 700, color: 'var(--color-text-muted)', minWidth: 32, textAlign: 'center' }}>
          {medal ?? entrada.posicao}
        </div>
        {entrada.perfil?.avatar_url
          ? <img src={entrada.perfil.avatar_url} style={{ width: 40, height: 40, borderRadius: '50%' }} alt="" />
          : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani', fontWeight: 700, color: '#fff' }}>{entrada.perfil?.nome_display[0]}</div>
        }
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'DM Sans', fontWeight: 500 }}>{entrada.perfil?.nome_display}</p>
          <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: 'var(--color-text-muted)' }}>{entrada.vitorias}V / {entrada.derrotas}D</p>
        </div>
        <div style={{ fontFamily: 'Rajdhani', fontSize: '22px', fontWeight: 700, color: 'var(--color-blue-light)' }}>{entrada.pontos} pts</div>
      </div>
    </Link>
  )
}
