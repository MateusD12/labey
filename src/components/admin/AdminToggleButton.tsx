import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AdminToggleButton({ userId, isAdmin, isSelf }: { userId: string; isAdmin: boolean; isSelf: boolean }) {
  const [admin, setAdmin] = useState(isAdmin)
  const [loading, setLoading] = useState(false)

  if (isSelf) {
    return <span style={{ color: 'var(--color-success)', fontSize: '16px' }}>✓ (você)</span>
  }

  const toggle = async () => {
    setLoading(true)
    const { error } = await supabase.from('perfis').update({ is_admin: !admin }).eq('id', userId)
    if (!error) setAdmin(a => !a)
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: admin ? 'rgba(34,197,94,0.15)' : 'rgba(160,160,184,0.15)', color: admin ? 'var(--color-success)' : 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: '12px', cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s' }}>
      {loading ? '...' : admin ? 'Admin ✓' : 'Não admin'}
    </button>
  )
}
