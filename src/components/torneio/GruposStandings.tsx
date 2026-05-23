import type { Partida, Inscricao } from '@/types'
import { calcularClassificacaoGrupo } from '@/lib/algorithms/grupos'

interface Props {
  partidas: Partida[]
  inscricoes: Inscricao[]
  pontos?: { vitoria: number; empate: number; derrota: number }
}

export function GruposStandings({ partidas, inscricoes, pontos = { vitoria: 3, empate: 1, derrota: 0 } }: Props) {
  const grupos = [...new Set(partidas.map(p => p.grupo).filter(Boolean) as string[])].sort()
  const classificacao = calcularClassificacaoGrupo(partidas, pontos)

  if (!grupos.length) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
      Grupos ainda não foram gerados.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {grupos.map(grupo => {
        const membros = inscricoes.filter(i => i.grupo === grupo)
        const rows = membros
          .map(i => ({ ins: i, cls: classificacao.get(i.blade_id) }))
          .sort((a, b) => {
            const pa = a.cls?.pontos ?? 0, pb = b.cls?.pontos ?? 0
            if (pb !== pa) return pb - pa
            return (b.cls?.saldo ?? 0) - (a.cls?.saldo ?? 0)
          })

        return (
          <div key={grupo} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'rgba(43,91,232,0.08)' }}>
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 17, color: 'var(--color-blue-light)' }}>
                Grupo {grupo}
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['#', 'Blader', 'P', 'V', 'E', 'D', 'Pts'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textAlign: h === 'Blader' ? 'left' : 'center' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ ins, cls }, pos) => (
                  <tr key={ins.id} style={{ borderBottom: pos < rows.length - 1 ? '1px solid var(--color-border)' : 'none', background: pos === 0 ? 'rgba(43,91,232,0.06)' : 'transparent' }}>
                    <td style={{ padding: '9px 10px', textAlign: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: pos === 0 ? 'var(--color-blue-light)' : 'var(--color-text-muted)' }}>{pos + 1}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {ins.perfil?.avatar_url && (
                          <img src={ins.perfil.avatar_url} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                        )}
                        <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-primary)', fontWeight: pos === 0 ? 600 : 400 }}>
                          {ins.perfil?.nome_display ?? ins.perfil?.username ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td style={numCell}>{cls?.vitorias ?? 0 + (cls?.empates ?? 0) + (cls?.derrotas ?? 0)}</td>
                    <td style={{ ...numCell, color: '#22c55e' }}>{cls?.vitorias ?? 0}</td>
                    <td style={numCell}>{cls?.empates ?? 0}</td>
                    <td style={{ ...numCell, color: '#ef4444' }}>{cls?.derrotas ?? 0}</td>
                    <td style={{ ...numCell, fontWeight: 700, color: 'var(--color-blue-light)' }}>{cls?.pontos ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

const numCell: React.CSSProperties = {
  padding: '9px 10px', textAlign: 'center',
  fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 14,
  color: 'var(--color-text-secondary)',
}
