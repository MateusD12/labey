// ─────────────────────────────────────────────────────────────────────────────
// ResultadoModalDuplo.tsx
//
// Identical UI to ResultadoModal, but delegates ALL save + routing logic to
// the `registrarResultado` function from useBracketDuplo.
// This keeps the visual layer clean and the business logic isolated.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Partida } from '@/types'

interface Props {
  partida: Partida
  onClose: () => void
  onSaved: () => void
  /** Injected from useBracketDuplo — handles save + full DE routing */
  registrarResultado: (
    partida: Partida,
    vencedorId: string,
    score1?: number,
    score2?: number,
  ) => Promise<void>
}

export function ResultadoModalDuplo({ partida, onClose, onSaved, registrarResultado }: Props) {
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')
  const [saving, setSaving] = useState(false)

  const commit = async (vencedorId: string, s1?: number, s2?: number) => {
    setSaving(true)
    try {
      await registrarResultado(partida, vencedorId, s1, s2)
      onSaved()
      onClose()
    } catch (err) {
      console.error('[ResultadoModalDuplo] commit error', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    const s1 = parseInt(score1) || 0
    const s2 = parseInt(score2) || 0
    const vencedor = s1 > s2 ? partida.blade1_id : s2 > s1 ? partida.blade2_id : null
    if (!vencedor) return // empate sem critério → não salvar
    await commit(vencedor, s1, s2)
  }

  const handleWO = async (vencedorId: string | null | undefined) => {
    if (!vencedorId) return
    await commit(vencedorId)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    padding: '10px 14px',
    color: 'var(--color-text-primary)',
    fontFamily: 'Rajdhani',
    fontWeight: 700,
    fontSize: '20px',
    width: '80px',
    textAlign: 'center',
  }

  // Determine bracket context label for the modal header
  const faseLabel = (() => {
    const { fase, numero_rodada } = partida
    if (fase === 'grand_final') {
      return numero_rodada === 2 ? '🔁 Reset de Chave' : '🏆 Grande Final'
    }
    if (fase === 'winners') return `WB R${numero_rodada}`
    if (fase === 'losers')  return `LB R${numero_rodada}`
    return fase
  })()

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 16, padding: 32, width: '100%', maxWidth: 400,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700 }}>
            Registrar Resultado
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 24 }}>
          {faseLabel}
        </p>

        {/* Score inputs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              {partida.blade1?.nome_display ?? 'Blade 1'}
            </p>
            <input
              type="number" min="0" value={score1}
              onChange={e => setScore1(e.target.value)}
              style={inputStyle}
            />
          </div>

          <span style={{ fontFamily: 'Rajdhani', fontSize: '24px', color: 'var(--color-text-muted)' }}>×</span>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              {partida.blade2?.nome_display ?? 'Blade 2'}
            </p>
            <input
              type="number" min="0" value={score2}
              onChange={e => setScore2(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ width: '100%' }}
        >
          {saving ? 'Salvando...' : 'Salvar Resultado'}
        </button>

        {/* W.O. section */}
        <div style={{ marginTop: 12, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
          <p style={{ fontFamily: 'DM Sans', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            W.O. — ausência / desclassificação
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={() => handleWO(partida.blade1_id)}
              disabled={saving}
              style={{
                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '8px', cursor: 'pointer',
                color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: '12px',
              }}
            >
              W.O. → {partida.blade1?.nome_display ?? 'Blade 1'}
            </button>
            <button
              onClick={() => handleWO(partida.blade2_id)}
              disabled={saving}
              style={{
                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '8px', cursor: 'pointer',
                color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: '12px',
              }}
            >
              W.O. → {partida.blade2?.nome_display ?? 'Blade 2'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
