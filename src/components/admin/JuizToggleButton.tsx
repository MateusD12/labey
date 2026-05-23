import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function JuizToggleButton({ userId, isJuiz, onToggle }: { userId: string; isJuiz: boolean; onToggle?: (v: boolean) => void }) {
  const [juiz, setJuiz] = useState(isJuiz)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    const { error } = await supabase.from('perfis').update({ is_juiz: !juiz }).eq('id', userId)
    if (!error) { setJuiz(j => !j); onToggle?.(!juiz) }
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: juiz ? 'rgba(245,158,11,0.15)' : 'rgba(160,160,184,0.15)', color: juiz ? 'var(--color-warning)' : 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: '12px', cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s' }}>
      {loading ? '...' : juiz ? 'Juíz ⚖️' : 'Não juíz'}
    </button>
  )
}
