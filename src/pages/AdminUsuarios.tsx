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
  const [busca, setBusca] = useState('')

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

  const filtrados = busca.trim()
    ? usuarios.filter(u =>
        u.nome_display.toLowerCase().includes(busca.toLowerCase()) ||
        u.username.toLowerCase().includes(busca.toLowerCase()) ||
        (u.cidade ?? '').toLowerCase().includes(busca.toLowerCase())
      )
    : usuarios

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontSize: '28px', fontWeight: 700, margin: 0 }}>Usuários ({usuarios.length})</h1>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, fontFamily: 'DM Sans', color: 'var(--color-text-muted)' }}>
            <span style={{ color: 'var(--color-warning)' }}>⚖️ {usuarios.filter(u => u.is_juiz).length} juízes</span>
            <span style={{ color: 'var(--color-success)' }}>★ {usuarios.filter(u => u.is_admin).length} admins</span>
          </div>
        </div>

        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Filtrar por nome, username ou cidade..."
          style={{ width: '100%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: '13px', boxSizing: 'border-box', marginBottom: 16 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtrados.map(u => (
            <div key={u.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Avatar */}
              {u.avatar_url
                ? <img src={u.avatar_url} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#fff', fontWeight: 700, flexShrink: 0 }}>{u.nome_display[0]}</div>
              }

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {u.nome_display}
                  {u.is_admin && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(34,197,94,0.15)', color: 'var(--color-success)', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>ADMIN</span>}
                  {u.is_juiz && <span style={{ marginLeft: 4, fontSize: 10, background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>JUÍZ</span>}
                </div>
                <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                  @{u.username}{u.cidade ? ` · ${u.cidade}` : ''}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <JuizToggleButton userId={u.id} isJuiz={u.is_juiz ?? false} />
                <AdminToggleButton userId={u.id} isAdmin={u.is_admin} isSelf={u.id === user?.id} />
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 13 }}>Nenhum usuário encontrado.</div>
          )}
        </div>
      </main>
    </>
  )
}
