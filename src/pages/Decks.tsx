import { useState, useEffect, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { DeckCard } from '@/components/beyblade/DeckCard'
import { fetchUserDecks, saveUserDecks, fetchCatalog, fetchUserCollection } from '@/lib/beyblades'
import { useAuth } from '@/lib/auth'
import type { Deck, DeckBey, DeckPart, BeybladeRow } from '@/types'

export default function Decks() {
  const { user } = useAuth()
  const [decks, setDecks] = useState<Deck[]>([])
  const [catalog, setCatalog] = useState<BeybladeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [showNewDeck, setShowNewDeck] = useState(false)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const [d, cat, personal] = await Promise.all([
        fetchUserDecks(user.id),
        fetchCatalog(),
        fetchUserCollection(user.id),
      ])
      setDecks(d)
      setCatalog([...cat, ...personal])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void load() }, [load])

  async function persist(updated: Deck[]) {
    if (!user) return
    setDecks(updated)
    await saveUserDecks(user.id, updated)
  }

  function handleResult(deckId: string, beyId: string, result: 'win' | 'loss') {
    const updated = decks.map(d => d.id !== deckId ? d : {
      ...d,
      beyblades: d.beyblades.map(b => b.id !== beyId ? b : {
        ...b,
        wins: b.wins + (result === 'win' ? 1 : 0),
        losses: b.losses + (result === 'loss' ? 1 : 0),
      }),
    })
    void persist(updated)
  }

  function handleDelete(deckId: string) {
    void persist(decks.filter(d => d.id !== deckId))
  }

  function handleSaveDeck(deck: Deck) {
    const existing = decks.find(d => d.id === deck.id)
    const updated = existing
      ? decks.map(d => d.id === deck.id ? deck : d)
      : [...decks, deck]
    void persist(updated)
    setEditingDeck(null)
    setShowNewDeck(false)
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 16px', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 16 }}>Faça login para acessar seus decks.</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: 'var(--color-text-primary)', margin: 0 }}>
            Meu Arsenal
          </h1>
          <button onClick={() => setShowNewDeck(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--color-blue-primary)', color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: 9, cursor: 'pointer',
            fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14,
          }}>
            <Plus size={16} /> Novo Deck
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
            Carregando...
          </div>
        ) : decks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
            <div style={{ fontSize: 15 }}>Você ainda não tem decks. Crie seu primeiro arsenal!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {decks.map(d => (
              <DeckCard
                key={d.id}
                deck={d}
                onEdit={setEditingDeck}
                onDelete={handleDelete}
                onResult={handleResult}
              />
            ))}
          </div>
        )}
      </div>

      {(showNewDeck || editingDeck) && (
        <DeckEditorModal
          deck={editingDeck ?? undefined}
          catalog={catalog}
          onSave={handleSaveDeck}
          onClose={() => { setShowNewDeck(false); setEditingDeck(null) }}
        />
      )}
    </>
  )
}

// ─── Deck Editor ──────────────────────────────────────────────────────────────

interface DeckEditorProps {
  deck?: Deck
  catalog: BeybladeRow[]
  onSave: (d: Deck) => void
  onClose: () => void
}

function DeckEditorModal({ deck, catalog, onSave, onClose }: DeckEditorProps) {
  const [name, setName] = useState(deck?.name ?? '')
  const [beyblades, setBeyblades] = useState<DeckBey[]>(deck?.beyblades ?? [])
  const [showAddBey, setShowAddBey] = useState(false)
  const [newBeyLabel, setNewBeyLabel] = useState('')
  const [selectedParts, setSelectedParts] = useState<string[]>([])
  const [partSearch, setPartSearch] = useState('')

  function addBey() {
    if (!newBeyLabel.trim()) return
    const bey: DeckBey = {
      id: crypto.randomUUID(),
      label: newBeyLabel.trim(),
      parts: selectedParts.map(id => ({ rowId: id } as DeckPart)),
      wins: 0, losses: 0,
    }
    setBeyblades(b => [...b, bey])
    setNewBeyLabel('')
    setSelectedParts([])
    setPartSearch('')
    setShowAddBey(false)
  }

  function removeBey(id: string) {
    setBeyblades(b => b.filter(x => x.id !== id))
  }

  function togglePart(id: string) {
    setSelectedParts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  function save() {
    if (!name.trim()) return
    onSave({
      id: deck?.id ?? crypto.randomUUID(),
      name: name.trim(),
      beyblades,
    })
  }

  const filteredCatalog = partSearch
    ? catalog.filter(p => p.peca.toLowerCase().includes(partSearch.toLowerCase()) || p.tipo.toLowerCase().includes(partSearch.toLowerCase()))
    : catalog

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--color-bg-primary)', borderRadius: 14, padding: 24,
        width: '100%', maxWidth: 500, border: '1px solid var(--color-border)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: 'var(--color-text-primary)' }}>
            {deck ? 'Editar Deck' : 'Novo Deck'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
            Nome do Deck *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Meu deck principal"
            style={{ width: '100%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '9px 12px', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Beyblades ({beyblades.length})
            </span>
            <button onClick={() => setShowAddBey(v => !v)} style={{
              background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-blue-primary)',
              padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600,
            }}>
              + Adicionar
            </button>
          </div>

          {showAddBey && (
            <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid var(--color-border)' }}>
              <input
                type="text"
                value={newBeyLabel}
                onChange={e => setNewBeyLabel(e.target.value)}
                placeholder="Nome/label do beyblade"
                style={{ width: '100%', marginBottom: 10, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '8px 10px', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                value={partSearch}
                onChange={e => setPartSearch(e.target.value)}
                placeholder="Filtrar peças..."
                style={{ width: '100%', marginBottom: 8, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 7, padding: '7px 10px', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredCatalog.slice(0, 50).map(p => (
                  <label key={p.id ?? p.peca} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 2px' }}>
                    <input type="checkbox" checked={selectedParts.includes(p.id ?? p.peca)} onChange={() => togglePart(p.id ?? p.peca)} />
                    <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-primary)' }}>
                      {p.peca} <span style={{ color: 'var(--color-text-muted)' }}>({p.tipo})</span>
                    </span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={addBey} disabled={!newBeyLabel.trim()} style={{
                  flex: 1, background: 'var(--color-blue-primary)', color: '#fff', border: 'none',
                  padding: '8px', borderRadius: 7, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
                  opacity: !newBeyLabel.trim() ? 0.5 : 1,
                }}>
                  Confirmar
                </button>
                <button onClick={() => setShowAddBey(false)} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '8px 14px', borderRadius: 7, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13 }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {beyblades.map(bey => (
            <div key={bey.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg-secondary)', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
              <div>
                <div style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{bey.label}</div>
                <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)' }}>{bey.parts.length} peça(s)</div>
              </div>
              <button onClick={() => removeBey(bey.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={save} disabled={!name.trim()} style={{
          width: '100%', background: 'var(--color-blue-primary)', color: '#fff', border: 'none',
          padding: '12px', borderRadius: 9, cursor: !name.trim() ? 'not-allowed' : 'pointer',
          fontFamily: 'DM Sans', fontWeight: 600, fontSize: 15, opacity: !name.trim() ? 0.5 : 1,
        }}>
          Salvar Deck
        </button>
      </div>
    </div>
  )
}
