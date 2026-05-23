import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, LayoutGrid, List, X } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { PartCard } from '@/components/beyblade/PartCard'
import { DeckCard } from '@/components/beyblade/DeckCard'
import { AddPartModal } from '@/components/beyblade/AddPartModal'
import { fetchAllParts, fetchUserCollection, addUserPart, fetchUserDecks, saveUserDecks } from '@/lib/beyblades'
import { getImageUrl } from '@/lib/algorithms/combos'
import { useAuth } from '@/lib/auth'
import type { BeybladeRow, Deck, DeckBey, DeckPart } from '@/types'

type Tab = 'pecas' | 'beyblade' | 'minhas' | 'decks'

export default function Colecao() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('pecas')

  // parts
  const [allParts, setAllParts] = useState<BeybladeRow[]>([])
  const [userParts, setUserParts] = useState<BeybladeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterGeracao, setFilterGeracao] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  // decks
  const [decks, setDecks] = useState<Deck[]>([])
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [showNewDeck, setShowNewDeck] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [all, personal, userDecks] = await Promise.all([
        fetchAllParts(),
        user ? fetchUserCollection(user.id) : Promise.resolve([]),
        user ? fetchUserDecks(user.id) : Promise.resolve([]),
      ])
      setAllParts(all)
      setUserParts(personal)
      setDecks(userDecks)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void load() }, [load])

  // ─── filtering ────────────────────────────────────────────────────────────
  const source = tab === 'minhas' ? userParts : allParts

  const tipos = [...new Set(source.map(p => p.tipo))].filter(Boolean).sort()
  const geracoes = [...new Set(source.map(p => p.geracao))].filter(Boolean).sort()

  const filtered = source.filter(p => {
    if (filterTipo && p.tipo !== filterTipo) return false
    if (filterGeracao && p.geracao !== filterGeracao) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.peca.toLowerCase().includes(q) && !p.beyblade.toLowerCase().includes(q)) return false
    }
    return true
  })

  // group by beyblade name
  const byBeyblade = filtered.reduce<Record<string, BeybladeRow[]>>((acc, p) => {
    const key = p.beyblade || 'Sem nome'
    ;(acc[key] ??= []).push(p)
    return acc
  }, {})

  // ─── deck helpers ─────────────────────────────────────────────────────────
  async function persistDecks(updated: Deck[]) {
    if (!user) return
    setDecks(updated)
    await saveUserDecks(user.id, updated)
  }

  function handleResult(deckId: string, beyId: string, result: 'win' | 'loss') {
    void persistDecks(decks.map(d => d.id !== deckId ? d : {
      ...d,
      beyblades: d.beyblades.map(b => b.id !== beyId ? b : {
        ...b,
        wins: b.wins + (result === 'win' ? 1 : 0),
        losses: b.losses + (result === 'loss' ? 1 : 0),
      }),
    }))
  }

  function handleDeleteDeck(id: string) {
    void persistDecks(decks.filter(d => d.id !== id))
  }

  function handleSaveDeck(deck: Deck) {
    const exists = decks.find(d => d.id === deck.id)
    void persistDecks(exists ? decks.map(d => d.id === deck.id ? deck : d) : [...decks, deck])
    setEditingDeck(null)
    setShowNewDeck(false)
  }

  // ─── render ───────────────────────────────────────────────────────────────
  const TABS: [Tab, string, number | null][] = [
    ['pecas',    'Peças',          allParts.length],
    ['beyblade', 'Por Beyblade',   null],
    ['minhas',   'Minha Coleção',  user ? userParts.length : null],
    ['decks',    'Decks',          user ? decks.length : null],
  ]

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: 'var(--color-text-primary)', margin: 0 }}>
            Coleção
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {user && tab !== 'decks' && (
              <button onClick={() => setShowAdd(true)} style={btnPrimary}>
                <Plus size={15} /> Adicionar Peça
              </button>
            )}
            {user && tab === 'decks' && (
              <button onClick={() => setShowNewDeck(true)} style={btnPrimary}>
                <Plus size={15} /> Novo Deck
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 20, overflowX: 'auto' }}>
          {TABS.map(([t, label, count]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600,
              color: tab === t ? 'var(--color-blue-primary)' : 'var(--color-text-muted)',
              padding: '10px 16px',
              borderBottom: tab === t ? '2px solid var(--color-blue-primary)' : '2px solid transparent',
              marginBottom: -1,
            }}>
              {label}
              {count !== null && (
                <span style={{ marginLeft: 5, fontWeight: 400, fontSize: 11 }}>({count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Filters (not for decks tab) */}
        {tab !== 'decks' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text" placeholder="Buscar peça ou beyblade..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Filter size={14} color="var(--color-text-muted)" />
              <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={selectStyle}>
                <option value="">Tipo</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterGeracao} onChange={e => setFilterGeracao(e.target.value)} style={selectStyle}>
                <option value="">Geração</option>
                {geracoes.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</div>
        ) : (
          <>
            {/* Peças — grid simples */}
            {tab === 'pecas' && (
              filtered.length === 0
                ? <Empty msg="Nenhuma peça encontrada." />
                : <PartsGrid parts={filtered} />
            )}

            {/* Por Beyblade — agrupado */}
            {tab === 'beyblade' && (
              filtered.length === 0
                ? <Empty msg="Nenhuma peça encontrada." />
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {Object.entries(byBeyblade).sort(([a], [b]) => a.localeCompare(b)).map(([name, parts]) => (
                      <div key={name}>
                        <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: 'var(--color-text-primary)', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--color-border)' }}>
                          {name}
                          <span style={{ marginLeft: 8, fontFamily: 'DM Sans', fontSize: 12, fontWeight: 400, color: 'var(--color-text-muted)' }}>
                            {parts.length} peça{parts.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <PartsGrid parts={parts} />
                      </div>
                    ))}
                  </div>
            )}

            {/* Minha Coleção */}
            {tab === 'minhas' && (
              !user
                ? <Empty msg="Faça login para ver sua coleção." />
                : filtered.length === 0
                  ? <Empty msg="Você ainda não adicionou peças. Use o botão acima!" />
                  : <PartsGrid parts={filtered} />
            )}

            {/* Decks */}
            {tab === 'decks' && (
              !user
                ? <Empty msg="Faça login para gerenciar seus decks." />
                : decks.length === 0
                  ? <Empty msg="Você ainda não tem decks. Crie seu primeiro arsenal!" icon="⚡" />
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {decks.map(d => (
                        <DeckCard key={d.id} deck={d} onEdit={setEditingDeck} onDelete={handleDeleteDeck} onResult={handleResult} />
                      ))}
                    </div>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <AddPartModal onClose={() => setShowAdd(false)} onSave={async (part, file) => {
          if (!user) return
          await addUserPart(user.id, part, file)
          await load()
        }} />
      )}

      {(showNewDeck || editingDeck) && user && (
        <DeckEditorModal
          deck={editingDeck ?? undefined}
          catalog={allParts.concat(userParts.filter(p => !allParts.find(a => a.id === p.id)))}
          onSave={handleSaveDeck}
          onClose={() => { setShowNewDeck(false); setEditingDeck(null) }}
        />
      )}
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PartsGrid({ parts }: { parts: BeybladeRow[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
      {parts.map((p, i) => (
        <PartCard key={p.id ?? i} part={{ ...p, imageUrl: getImageUrl(p) }} />
      ))}
    </div>
  )
}

function Empty({ msg, icon = '🔍' }: { msg: string; icon?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{msg}</div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
  borderRadius: 8, padding: '7px 10px', color: 'var(--color-text-primary)',
  fontFamily: 'DM Sans', fontSize: 13, outline: 'none', cursor: 'pointer',
}

const btnPrimary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: 'var(--color-blue-primary)', color: '#fff', border: 'none',
  padding: '8px 16px', borderRadius: 9, cursor: 'pointer',
  fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14,
}

// ─── Deck Editor Modal ─────────────────────────────────────────────────────────

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

  const filteredCatalog = partSearch
    ? catalog.filter(p => p.peca.toLowerCase().includes(partSearch.toLowerCase()) || p.tipo.toLowerCase().includes(partSearch.toLowerCase()))
    : catalog

  function addBey() {
    if (!newBeyLabel.trim()) return
    setBeyblades(b => [...b, {
      id: crypto.randomUUID(),
      label: newBeyLabel.trim(),
      parts: selectedParts.map(id => ({ rowId: id } as DeckPart)),
      wins: 0, losses: 0,
    }])
    setNewBeyLabel(''); setSelectedParts([]); setPartSearch(''); setShowAddBey(false)
  }

  function save() {
    if (!name.trim()) return
    onSave({ id: deck?.id ?? crypto.randomUUID(), name: name.trim(), beyblades })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--color-bg-primary)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 500, border: '1px solid var(--color-border)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: 'var(--color-text-primary)' }}>
            {deck ? 'Editar Deck' : 'Novo Deck'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Nome do Deck *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Meu deck principal" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Beyblades ({beyblades.length})
            </span>
            <button onClick={() => setShowAddBey(v => !v)} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-blue-primary)', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600 }}>
              + Adicionar
            </button>
          </div>

          {showAddBey && (
            <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid var(--color-border)' }}>
              <input type="text" value={newBeyLabel} onChange={e => setNewBeyLabel(e.target.value)} placeholder="Nome do beyblade" style={{ ...inputStyle, marginBottom: 10 }} />
              <input type="text" value={partSearch} onChange={e => setPartSearch(e.target.value)} placeholder="Filtrar peças..." style={{ ...inputStyle, fontSize: 12, marginBottom: 8 }} />
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredCatalog.slice(0, 60).map(p => (
                  <label key={p.id ?? p.peca} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 2px' }}>
                    <input type="checkbox" checked={selectedParts.includes(p.id ?? p.peca)} onChange={() => setSelectedParts(prev => prev.includes(p.id ?? p.peca) ? prev.filter(x => x !== (p.id ?? p.peca)) : [...prev, p.id ?? p.peca])} />
                    <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-primary)' }}>
                      {p.peca} <span style={{ color: 'var(--color-text-muted)' }}>({p.tipo})</span>
                    </span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={addBey} disabled={!newBeyLabel.trim()} style={{ flex: 1, background: 'var(--color-blue-primary)', color: '#fff', border: 'none', padding: '8px', borderRadius: 7, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, opacity: !newBeyLabel.trim() ? 0.5 : 1 }}>
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
              <button onClick={() => setBeyblades(b => b.filter(x => x.id !== bey.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <button onClick={save} disabled={!name.trim()} style={{ width: '100%', background: 'var(--color-blue-primary)', color: '#fff', border: 'none', padding: '12px', borderRadius: 9, cursor: !name.trim() ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 15, opacity: !name.trim() ? 0.5 : 1 }}>
          Salvar Deck
        </button>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600,
  color: 'var(--color-text-muted)', display: 'block', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border)', borderRadius: 8,
  padding: '9px 12px', color: 'var(--color-text-primary)',
  fontFamily: 'DM Sans', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
