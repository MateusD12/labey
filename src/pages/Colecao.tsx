import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { PartCard } from '@/components/beyblade/PartCard'
import { AddPartModal } from '@/components/beyblade/AddPartModal'
import { fetchCatalog, fetchUserCollection, addUserPart } from '@/lib/beyblades'
import { getImageUrl } from '@/lib/algorithms/combos'
import { useAuth } from '@/lib/auth'
import type { BeybladeRow } from '@/types'

type Tab = 'catalogo' | 'colecao'

export default function Colecao() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('catalogo')
  const [catalog, setCatalog] = useState<BeybladeRow[]>([])
  const [userParts, setUserParts] = useState<BeybladeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterGeracao, setFilterGeracao] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cat, personal] = await Promise.all([
        fetchCatalog(),
        user ? fetchUserCollection(user.id) : Promise.resolve([]),
      ])
      setCatalog(cat)
      setUserParts(personal)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void load() }, [load])

  const source = tab === 'catalogo' ? catalog : userParts

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

  async function handleSavePart(part: Omit<BeybladeRow, 'id'>, file?: File) {
    if (!user) return
    await addUserPart(user.id, part, file)
    await load()
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: 'var(--color-text-primary)', margin: 0 }}>
            Coleção
          </h1>
          {user && (
            <button onClick={() => setShowAdd(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--color-blue-primary)', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: 9, cursor: 'pointer',
              fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14,
            }}>
              <Plus size={16} /> Adicionar Peça
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--color-border)' }}>
          {([['catalogo', 'Catálogo'], ['colecao', 'Minha Coleção']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600,
              color: tab === t ? 'var(--color-blue-primary)' : 'var(--color-text-muted)',
              padding: '10px 18px',
              borderBottom: tab === t ? '2px solid var(--color-blue-primary)' : '2px solid transparent',
              marginBottom: -1,
            }}>
              {label}
              <span style={{ marginLeft: 6, fontWeight: 400, fontSize: 12 }}>
                ({t === 'catalogo' ? catalog.length : userParts.length})
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar peça ou beyblade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                borderRadius: 8, color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 13,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
            {tab === 'colecao' && !user
              ? 'Faça login para ver sua coleção.'
              : 'Nenhuma peça encontrada.'}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
          }}>
            {filtered.map((p, i) => (
              <PartCard key={p.id ?? i} part={{ ...p, imageUrl: getImageUrl(p) }} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddPartModal
          onClose={() => setShowAdd(false)}
          onSave={handleSavePart}
        />
      )}
    </>
  )
}

const selectStyle: React.CSSProperties = {
  background: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: 8, padding: '7px 10px',
  color: 'var(--color-text-primary)',
  fontFamily: 'DM Sans', fontSize: 13, outline: 'none', cursor: 'pointer',
}
