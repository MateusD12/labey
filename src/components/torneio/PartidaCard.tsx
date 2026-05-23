import type { Partida } from '@/types'

interface Props {
  partida: Partida
  isAdmin?: boolean
  onRegistrar?: (partida: Partida) => void
}

export function PartidaCard({ partida, isAdmin, onRegistrar }: Props) {
  const b1 = partida.blade1
  const b2 = partida.blade2
  const isFinished = partida.status === 'finalizada'

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: `1px solid ${isFinished ? 'var(--color-border)' : 'var(--color-blue-primary)'}`,
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, fontWeight: partida.vencedor_id === partida.blade1_id ? 700 : 400 }}>
          {b1?.avatar_url && <img src={b1.avatar_url} style={{ width: 28, height: 28, borderRadius: '50%', border: partida.vencedor_id === partida.blade1_id ? '2px solid var(--color-blue-primary)' : '2px solid var(--color-border)' }} alt="" />}
          <span style={{ fontFamily: 'DM Sans', fontSize: '13px', color: partida.vencedor_id === partida.blade1_id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
            {b1?.nome_display ?? 'A definir'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '18px' }}>
          <span style={{ color: partida.vencedor_id === partida.blade1_id ? 'var(--color-blue-light)' : 'var(--color-text-muted)' }}>
            {partida.blade1_score ?? (isFinished ? '0' : '-')}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>×</span>
          <span style={{ color: partida.vencedor_id === partida.blade2_id ? 'var(--color-blue-light)' : 'var(--color-text-muted)' }}>
            {partida.blade2_score ?? (isFinished ? '0' : '-')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end', fontWeight: partida.vencedor_id === partida.blade2_id ? 700 : 400 }}>
          <span style={{ fontFamily: 'DM Sans', fontSize: '13px', color: partida.vencedor_id === partida.blade2_id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', textAlign: 'right' }}>
            {b2?.nome_display ?? 'A definir'}
          </span>
          {b2?.avatar_url && <img src={b2.avatar_url} style={{ width: 28, height: 28, borderRadius: '50%', border: partida.vencedor_id === partida.blade2_id ? '2px solid var(--color-blue-primary)' : '2px solid var(--color-border)' }} alt="" />}
        </div>
      </div>

      {isAdmin && !isFinished && (
        <button onClick={() => onRegistrar?.(partida)} style={{ background: 'var(--color-blue-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '12px', fontFamily: 'DM Sans', fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-end' }}>
          Registrar resultado
        </button>
      )}
    </div>
  )
}
