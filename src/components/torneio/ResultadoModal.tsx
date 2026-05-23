import { useState } from 'react'
import type { Partida } from '@/types'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

interface Props {
  partida: Partida
  onClose: () => void
  onSaved: () => void
}

export function ResultadoModal({ partida, onClose, onSaved }: Props) {
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')
  const [saving, setSaving] = useState(false)

  const handleWO = async (vencedorId: string | null | undefined) => {
    if (!vencedorId) return
    setSaving(true)
    await supabase.from('partidas').update({
      vencedor_id: vencedorId,
      status: 'w.o.',
    }).eq('id', partida.id)

    if (partida.numero_rodada && partida.posicao_bracket !== null && partida.posicao_bracket !== undefined) {
      const nextRodada = partida.numero_rodada + 1
      const nextPos = Math.floor(partida.posicao_bracket / 2)
      const slot = partida.posicao_bracket % 2 === 0 ? 'blade1_id' : 'blade2_id'
      await supabase.from('partidas')
        .update({ [slot]: vencedorId })
        .eq('torneio_id', partida.torneio_id)
        .eq('numero_rodada', nextRodada)
        .eq('posicao_bracket', nextPos)
    }

    setSaving(false)
    void supabase.functions.invoke('notify-next-judge', { body: { torneioId: partida.torneio_id } })
    onSaved()
    onClose()
  }

  const handleSave = async () => {
    const s1 = parseInt(score1) || 0
    const s2 = parseInt(score2) || 0
    const vencedor = s1 > s2 ? partida.blade1_id : s2 > s1 ? partida.blade2_id : null

    setSaving(true)
    await supabase.from('partidas').update({
      blade1_score: s1,
      blade2_score: s2,
      vencedor_id: vencedor,
      status: 'finalizada',
    }).eq('id', partida.id)

    // Advance winner to the next bracket round
    if (
      vencedor &&
      partida.numero_rodada &&
      partida.posicao_bracket !== null &&
      partida.posicao_bracket !== undefined
    ) {
      const nextRodada = partida.numero_rodada + 1
      const nextPos = Math.floor(partida.posicao_bracket / 2)
      const slot = partida.posicao_bracket % 2 === 0 ? 'blade1_id' : 'blade2_id'
      await supabase.from('partidas')
        .update({ [slot]: vencedor })
        .eq('torneio_id', partida.torneio_id)
        .eq('numero_rodada', nextRodada)
        .eq('posicao_bracket', nextPos)
    }

    setSaving(false)
    void supabase.functions.invoke('notify-next-judge', { body: { torneioId: partida.torneio_id } })
    onSaved()
    onClose()
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700 }}>Registrar Resultado</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 8 }}>{partida.blade1?.nome_display ?? 'Blade 1'}</p>
            <input type="number" min="0" value={score1} onChange={e => setScore1(e.target.value)} style={inputStyle} />
          </div>
          <span style={{ fontFamily: 'Rajdhani', fontSize: '24px', color: 'var(--color-text-muted)' }}>×</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 8 }}>{partida.blade2?.nome_display ?? 'Blade 2'}</p>
            <input type="number" min="0" value={score2} onChange={e => setScore2(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%' }}>
          {saving ? 'Salvando...' : 'Salvar Resultado'}
        </button>

        <div style={{ marginTop: 12, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
          <p style={{ fontFamily: 'DM Sans', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 8 }}>W.O. — ausência / desclassificação</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={() => handleWO(partida.blade1_id)} disabled={saving} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: '12px' }}>
              W.O. → {partida.blade1?.nome_display ?? 'Blade 1'}
            </button>
            <button onClick={() => handleWO(partida.blade2_id)} disabled={saving} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: '12px' }}>
              W.O. → {partida.blade2?.nome_display ?? 'Blade 2'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
