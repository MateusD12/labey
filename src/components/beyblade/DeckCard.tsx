import type { Deck, DeckBey } from '@/types'

interface DeckCardProps {
  deck: Deck
  onEdit?: (deck: Deck) => void
  onDelete?: (deckId: string) => void
  onResult?: (deckId: string, beyId: string, result: 'win' | 'loss') => void
}

export function DeckCard({ deck, onEdit, onDelete, onResult }: DeckCardProps) {
  const totalW = deck.beyblades.reduce((s, b) => s + b.wins, 0)
  const totalL = deck.beyblades.reduce((s, b) => s + b.losses, 0)
  const winrate = totalW + totalL > 0 ? Math.round((totalW / (totalW + totalL)) * 100) : null

  return (
    <div style={{
      background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: 'var(--color-text-primary)' }}>
            {deck.name}
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {deck.beyblades.length} beyblade{deck.beyblades.length !== 1 ? 's' : ''}
            {winrate !== null && ` · ${winrate}% WR`}
            {' · '}W {totalW} / L {totalL}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onEdit && (
            <button onClick={() => onEdit(deck)} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 12 }}>
              Editar
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(deck.id)} style={{ background: 'none', border: '1px solid #ef444444', color: '#ef4444', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 12 }}>
              Excluir
            </button>
          )}
        </div>
      </div>

      {deck.beyblades.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {deck.beyblades.map(bey => (
            <BeyRow key={bey.id} bey={bey} deckId={deck.id} onResult={onResult} />
          ))}
        </div>
      )}
    </div>
  )
}

function BeyRow({ bey, deckId, onResult }: { bey: DeckBey; deckId: string; onResult?: DeckCardProps['onResult'] }) {
  const total = bey.wins + bey.losses
  const wr = total > 0 ? Math.round((bey.wins / total) * 100) : null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--color-bg-tertiary)', borderRadius: 8, padding: '8px 12px',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {bey.label}
        </div>
        <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
          {bey.parts.length} peça{bey.parts.length !== 1 ? 's' : ''}
          {' · '}W {bey.wins} / L {bey.losses}
          {wr !== null && ` · ${wr}%`}
        </div>
      </div>
      {onResult && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onResult(deckId, bey.id, 'win')} style={{ background: '#10b98122', border: '1px solid #10b98144', color: '#10b981', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600 }}>
            W
          </button>
          <button onClick={() => onResult(deckId, bey.id, 'loss')} style={{ background: '#ef444422', border: '1px solid #ef444444', color: '#ef4444', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600 }}>
            L
          </button>
        </div>
      )}
    </div>
  )
}
