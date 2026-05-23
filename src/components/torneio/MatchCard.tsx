import type { Partida } from '@/types'

interface Props {
  partida: Partida
  isAdmin?: boolean
  onRegistrar?: () => void
  style?: React.CSSProperties
}

function PlayerRow({
  perfil, score, isWinner, isFinished, hasBorder,
}: {
  perfil: Partida['blade1']
  score: number | null | undefined
  isWinner: boolean
  isFinished: boolean
  hasBorder: boolean
}) {
  return (
    <div style={{
      height: 36,
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px 0 10px',
      gap: 8,
      background: isWinner ? 'rgba(43,91,232,0.2)' : 'transparent',
      borderBottom: hasBorder ? '1px solid var(--color-border)' : 'none',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        background: 'var(--color-border)', overflow: 'hidden',
      }}>
        {perfil?.avatar_url && (
          <img src={perfil.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        )}
      </div>

      <span style={{
        fontFamily: 'DM Sans', fontSize: 12, flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        color: isWinner ? '#fff' : isFinished ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
        fontWeight: isWinner ? 600 : 400,
      }}>
        {perfil?.username ?? 'A definir'}
      </span>

      <div style={{
        minWidth: 28, height: 22, borderRadius: 4, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
        background: isWinner
          ? 'var(--color-blue-primary)'
          : isFinished ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: isWinner ? '#fff' : 'var(--color-text-muted)',
      }}>
        {score != null ? score : ''}
      </div>
    </div>
  )
}

export function MatchCard({ partida, isAdmin, onRegistrar, style }: Props) {
  const isF = partida.status === 'finalizada'
  const isW1 = partida.vencedor_id === partida.blade1_id
  const isW2 = partida.vencedor_id === partida.blade2_id
  const isLive = partida.status === 'em_andamento'

  return (
    <div
      onClick={isAdmin && !isF ? onRegistrar : undefined}
      title={isAdmin && !isF ? 'Clique para registrar resultado' : undefined}
      style={{
        border: `1px solid ${isLive ? 'var(--color-warning)' : isF ? 'var(--color-border)' : 'rgba(43,91,232,0.25)'}`,
        borderRadius: 6,
        overflow: 'hidden',
        background: 'var(--color-bg-secondary)',
        cursor: isAdmin && !isF ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        ...style,
      }}
    >
      <PlayerRow perfil={partida.blade1} score={partida.blade1_score} isWinner={isW1} isFinished={isF} hasBorder />
      <PlayerRow perfil={partida.blade2} score={partida.blade2_score} isWinner={isW2} isFinished={isF} hasBorder={false} />
      {partida.juiz && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderTop: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Juiz:</span>
          <span style={{ fontSize: 10, color: 'var(--color-blue-light)', fontFamily: 'DM Sans', fontWeight: 600 }}>{partida.juiz.username}</span>
        </div>
      )}
    </div>
  )
}
