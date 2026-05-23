import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AdminToggleButton({ userId, isAdmin, isSelf, onToggle }: { userId: string; isAdmin: boolean; isSelf: boolean; onToggle?: (v: boolean) => void }) {
  const [admin, setAdmin] = useState(isAdmin)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(false)

  if (isSelf) {
    return <span style={{ color: 'var(--color-success)', fontSize: '16px' }}>✓ (você)</span>
  }

  const toggle = async () => {
    setLoading(true); setErr(false)
    const { error } = await supabase.from('perfis').update({ is_admin: !admin }).eq('id', userId)
    if (error) { setErr(true) } else { setAdmin(a => !a); onToggle?.(!admin) }
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading} title={err ? 'Erro ao salvar' : undefined} style={{ padding: '4px 12px', borderRadius: 6, border: err ? '1px solid var(--color-danger)' : 'none', background: err ? 'rgba(239,68,68,0.1)' : admin ? 'rgba(34,197,94,0.15)' : 'rgba(160,160,184,0.15)', color: err ? 'var(--color-danger)' : admin ? 'var(--color-success)' : 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: '12px', cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s' }}>
      {loading ? '...' : err ? 'Erro !' : admin ? 'Admin ✓' : 'Não admin'}
    </button>
  )
}
