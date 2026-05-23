import { useState, useEffect } from 'react'
import { RefreshCw, Shuffle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { ComboDisplay } from '@/components/beyblade/ComboDisplay'
import { fetchAllParts } from '@/lib/beyblades'
import { pickCombo } from '@/lib/algorithms/combos'
import type { BeybladeRow, ComboPart, SystemName } from '@/types'

interface GeneratedCombo {
  system: SystemName
  parts: ComboPart[]
}

export default function Combos() {
  const [parts, setParts] = useState<BeybladeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [combos, setCombos] = useState<[GeneratedCombo, GeneratedCombo] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchAllParts()
      .then(d => setParts(d))
      .catch(() => setError('Erro ao carregar peças.'))
      .finally(() => setLoading(false))
  }, [])

  function generate() {
    setError(null)
    setGenerating(true)
    try {
      const p1 = pickCombo(parts)
      const usedIds = new Set(p1.parts.map(p => p.id ? `id:${p.id}` : `b:${p.beyblade}|t:${p.tipo}|p:${p.peca}`))
      const p2 = pickCombo(parts, usedIds)
      setCombos([p1, p2])
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
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 28, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
            Gerador de Combos
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            Gera dois combos aleatórios sem peças repetidas — BX/UX, CX e CX Expend.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <button
            onClick={generate}
            disabled={loading || generating}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--color-blue-primary)', color: '#fff', border: 'none',
              padding: '13px 28px', borderRadius: 10,
              cursor: (loading || generating) ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16,
              opacity: (loading || generating) ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {combos
              ? <><RefreshCw size={18} /> Gerar Novos Combos</>
              : <><Shuffle size={18} /> Gerar Combos</>
            }
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
            Carregando peças...
          </div>
        )}

        {error && (
          <div style={{
            background: '#ef444422', border: '1px solid #ef444444',
            borderRadius: 10, padding: '14px 18px',
            color: '#ef4444', fontFamily: 'DM Sans', fontSize: 14, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {combos && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <ComboDisplay system={combos[0].system} parts={combos[0].parts} label="Jogador 1" />
            <ComboDisplay system={combos[1].system} parts={combos[1].parts} label="Jogador 2" />
          </div>
        )}

        {!loading && !combos && !error && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 15 }}>Clique em "Gerar Combos" para sortear dois combos competitivos</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{parts.length} peças disponíveis</div>
          </div>
        )}
      </div>
    </>
  )
}
