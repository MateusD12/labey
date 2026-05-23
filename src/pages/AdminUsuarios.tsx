import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { AdminToggleButton } from '@/components/admin/AdminToggleButton'
import { JuizToggleButton } from '@/components/admin/JuizToggleButton'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { Perfil } from '@/types'

export default function AdminUsuarios() {
  const { user, perfil, loading } = useAuth()
  const [usuarios, setUsuarios] = useState<Perfil[]>([])

  useEffect(() => {
    if (!perfil?.is_admin) return
    supabase.from('perfis').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setUsuarios(data as Perfil[]) })
  }, [perfil])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</div>
    </>
  )

  if (!perfil?.is_admin) return <Navigate to="/" replace />

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: '28px', fontWeight: 700, marginBottom: 24 }}>Usuários ({usuarios.length})</h1>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Usuário</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Username</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Cidade</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Juíz</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Admin</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {u.avatar_url
                        ? <img src={u.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%' }} alt="" />
                        : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#fff', fontWeight: 700 }}>{u.nome_display[0]}</div>
                      }
                      {u.nome_display}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>@{u.username}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{u.cidade ?? '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <JuizToggleButton userId={u.id} isJuiz={u.is_juiz ?? false} />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <AdminToggleButton userId={u.id} isAdmin={u.is_admin} isSelf={u.id === user?.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
