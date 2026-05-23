import type { Partida, Inscricao } from '@/types'

interface Standing {
  blade_id: string
  nome: string
  username: string
  wins: number
  losses: number
  history: ('W' | 'L')[]
}

function buildStandings(inscricoes: Inscricao[], partidas: Partida[]): Standing[] {
  const map = new Map<string, Standing>()

  for (const ins of inscricoes) {
    if (!ins.perfil) continue
    map.set(ins.blade_id, {
      blade_id: ins.blade_id,
      nome: ins.perfil.nome_display,
      username: ins.perfil.username,
      wins: 0, losses: 0, history: [],
    })
  }

  for (const p of partidas) {
    if (p.blade1_id && p.blade1 && !map.has(p.blade1_id)) {
      map.set(p.blade1_id, { blade_id: p.blade1_id, nome: p.blade1.nome_display, username: p.blade1.username, wins: 0, losses: 0, history: [] })
    }
    if (p.blade2_id && p.blade2 && !map.has(p.blade2_id)) {
      map.set(p.blade2_id, { blade_id: p.blade2_id, nome: p.blade2.nome_display, username: p.blade2.username, wins: 0, losses: 0, history: [] })
    }
  }

  for (const p of partidas) {
    if (p.status !== 'finalizada' || !p.blade1_id || !p.blade2_id) continue
    const s1 = map.get(p.blade1_id)
    const s2 = map.get(p.blade2_id)
    if (s1) {
      if (p.vencedor_id === p.blade1_id) { s1.wins++; s1.history.push('W') }
      else { s1.losses++; s1.history.push('L') }
    }
    if (s2) {
      if (p.vencedor_id === p.blade2_id) { s2.wins++; s2.history.push('W') }
      else { s2.losses++; s2.history.push('L') }
    }
  }

  return [...map.values()].sort((a, b) => b.wins - a.wins || a.losses - b.losses)
}

interface Props {
  inscricoes: Inscricao[]
  partidas: Partida[]
}

export function Posicoes({ inscricoes, partidas }: Props) {
  const standings = buildStandings(inscricoes, partidas)
  const medalColors: Record<number, string> = { 0: '#FFD700', 1: '#C0C0C0', 2: '#CD7F32' }

  if (standings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
        Nenhum participante registrado ainda.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans', fontSize: 13 }}>
        <thead>
          <tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, width: 48 }}>#</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500 }}>Blade</th>
            <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 500 }}>V</th>
            <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 500 }}>D</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500 }}>Histórico</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const pos = i + 1
            let sharedPos = pos
            if (i > 0) {
              const prev = standings[i - 1]
              if (prev.wins === s.wins && prev.losses === s.losses) sharedPos = pos - 1
            }
            const medal = medalColors[sharedPos - 1]

            return (
              <tr key={s.blade_id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {medal ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: medal, color: '#000', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 12 }}>
                      {sharedPos}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'Rajdhani', fontWeight: 700 }}>{sharedPos}</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{s.nome}</div>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-success)', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15 }}>{s.wins}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-danger)', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15 }}>{s.losses}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {s.history.length === 0 ? (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>—</span>
                    ) : s.history.map((badge, j) => (
                      <span key={j} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 4, background: badge === 'W' ? 'var(--color-blue-primary)' : '#7f1d1d', color: '#fff', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 11 }}>
                        {badge}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
