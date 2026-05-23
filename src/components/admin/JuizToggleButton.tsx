import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function JuizToggleButton({ userId, isJuiz, onToggle }: { userId: string; isJuiz: boolean; onToggle?: (v: boolean) => void }) {
  const [juiz, setJuiz] = useState(isJuiz)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(false)

  const toggle = async () => {
    setLoading(true); setErr(false)
    const { error } = await supabase.from('perfis').update({ is_juiz: !juiz }).eq('id', userId)
    if (error) { setErr(true) } else { setJuiz(j => !j); onToggle?.(!juiz) }
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading} title={err ? 'Erro ao salvar' : undefined} style={{ padding: '4px 12px', borderRadius: 6, border: err ? '1px solid var(--color-danger)' : 'none', background: err ? 'rgba(239,68,68,0.1)' : juiz ? 'rgba(245,158,11,0.15)' : 'rgba(160,160,184,0.15)', color: err ? 'var(--color-danger)' : juiz ? 'var(--color-warning)' : 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: '12px', cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s' }}>
      {loading ? '...' : err ? 'Erro !' : juiz ? 'Juíz ⚖️' : 'Não juíz'}
    </button>
  )
}
