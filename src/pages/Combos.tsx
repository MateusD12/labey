import { useState, useEffect } from 'react'
import { RefreshCw, Shuffle, History, ChevronDown, ChevronUp } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { ComboDisplay } from '@/components/beyblade/ComboDisplay'
import { fetchAllParts } from '@/lib/beyblades'
import { pickCombo } from '@/lib/algorithms/combos'
import type { BeybladeRow, ComboPart, SystemName } from '@/types'

interface GeneratedCombo { system: SystemName; parts: ComboPart[] }
interface HistoryEntry { id: string; ts: number; p1: GeneratedCombo; p2: GeneratedCombo }

const HISTORY_KEY = 'labey_combo_history'
const MAX_HISTORY = 5

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] }
}
function saveHistory(h: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)))
}

export default function Combos() {
  const [parts, setParts] = useState<BeybladeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [combos, setCombos] = useState<[GeneratedCombo, GeneratedCombo] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [filterGeracao, setFilterGeracao] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchAllParts()
      .then(d => setParts(d))
      .catch(() => setError('Erro ao carregar peças.'))
      .finally(() => setLoading(false))
  }, [])

  const geracoes = [...new Set(parts.map(p => p.geracao).filter(Boolean))].sort()
  const pool = filterGeracao ? parts.filter(p => p.geracao === filterGeracao) : parts

  function generate() {
    setError(null)
    setGenerating(true)
    try {
      const p1 = pickCombo(pool)
      const usedIds = new Set(p1.parts.map(p => p.id ? `id:${p.id}` : `b:${p.beyblade}|t:${p.tipo}|p:${p.peca}`))
      const p2 = pickCombo(pool, usedIds)
      setCombos([p1, p2])

      const entry: HistoryEntry = { id: crypto.randomUUID(), ts: Date.now(), p1, p2 }
      const updated = [entry, ...history].slice(0, MAX_HISTORY)
      setHistory(updated)
      saveHistory(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar combos.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
            Gerador de Combos
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            Gera dois combos aleatórios sem peças repetidas — BX/UX, CX e CX Expend.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          {geracoes.length > 0 && (
            <select
              value={filterGeracao}
              onChange={e => setFilterGeracao(e.target.value)}
              style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Todas as gerações</option>
              {geracoes.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
          <button
            onClick={generate}
            disabled={loading || generating}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--color-blue-primary)', color: '#fff', border: 'none',
              padding: '12px 28px', borderRadius: 10,
              cursor: (loading || generating) ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16,
              opacity: (loading || generating) ? 0.6 : 1,
            }}
          >
            {combos ? <><RefreshCw size={18} /> Gerar Novos</> : <><Shuffle size={18} /> Gerar Combos</>}
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
            Carregando peças...
          </div>
        )}

        {error && (
          <div style={{ background: '#ef444422', border: '1px solid #ef444444', borderRadius: 10, padding: '14px 18px', color: '#ef4444', fontFamily: 'DM Sans', fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {combos && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
            <ComboDisplay system={combos[0].system} parts={combos[0].parts} label="Jogador 1" />
            <ComboDisplay system={combos[1].system} parts={combos[1].parts} label="Jogador 2" />
          </div>
        )}

        {!loading && !combos && !error && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 15 }}>Clique em "Gerar Combos" para sortear dois combos competitivos</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              {filterGeracao ? `${pool.length} peças ${filterGeracao}` : `${parts.length} peças no total`}
            </div>
          </div>
        )}

        {/* Histórico */}
        {history.length > 0 && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
            <button onClick={() => setShowHistory(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600, padding: '4px 0', marginBottom: 12 }}>
              <History size={15} /> Histórico ({history.length})
              {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showHistory && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {history.map((entry, i) => (
                  <div key={entry.id} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                      #{i + 1} — {new Date(entry.ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                      <ComboDisplay system={entry.p1.system} parts={entry.p1.parts} label="Jogador 1" />
                      <ComboDisplay system={entry.p2.system} parts={entry.p2.parts} label="Jogador 2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
