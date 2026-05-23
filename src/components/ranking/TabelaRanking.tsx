import { Link } from 'react-router-dom'
import type { RankingEntrada } from '@/types'

export function TabelaRanking({ entradas }: { entradas: RankingEntrada[] }) {
  const medalha = (pos: number) => {
    if (pos === 1) return { bg: 'rgba(255,215,0,0.1)',   color: 'var(--color-gold)' }
    if (pos === 2) return { bg: 'rgba(192,192,192,0.1)', color: 'var(--color-silver)' }
    if (pos === 3) return { bg: 'rgba(205,127,50,0.1)',  color: 'var(--color-bronze)' }
    return { bg: 'transparent', color: 'var(--color-text-muted)' }
  }

  return (
    <>
      <style>{`
        .tr-hide-mobile { display: table-cell; }
        @media(max-width: 640px) {
          .tr-hide-mobile { display: none; }
          .tr-name-cell { max-width: 140px; }
        }
      `}</style>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', width: 36 }}>#</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Blade</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Pts</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>V</th>
              <th className="tr-hide-mobile" style={{ padding: '10px 12px', textAlign: 'center' }}>E</th>
              <th className="tr-hide-mobile" style={{ padding: '10px 12px', textAlign: 'center' }}>D</th>
              <th className="tr-hide-mobile" style={{ padding: '10px 12px', textAlign: 'center' }}>Torneios</th>
            </tr>
          </thead>
          <tbody>
            {entradas.map(entry => {
              const m = medalha(entry.posicao)
              return (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-border)', background: m.bg }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '17px', color: m.color }}>{entry.posicao}</td>
                  <td className="tr-name-cell" style={{ padding: '10px 12px' }}>
                    <Link to={`/perfil/${entry.blade_id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                      {entry.perfil?.avatar_url
                        ? <img src={entry.perfil.avatar_url} style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--color-border)', flexShrink: 0 }} alt="" />
                        : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '13px', color: '#fff', flexShrink: 0 }}>{entry.perfil?.nome_display?.[0]}</div>
                      }
                      <span style={{ fontFamily: 'DM Sans', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.perfil?.nome_display ?? '—'}
                      </span>
                    </Link>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '16px', color: 'var(--color-blue-light)' }}>{entry.pontos}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-success)', fontWeight: 600 }}>{entry.vitorias}</td>
                  <td className="tr-hide-mobile" style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-warning)' }}>{entry.empates}</td>
                  <td className="tr-hide-mobile" style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-danger)' }}>{entry.derrotas}</td>
                  <td className="tr-hide-mobile" style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>{entry.torneios_jogados}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
