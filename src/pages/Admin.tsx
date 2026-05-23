import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function Admin() {
  const { perfil, loading } = useAuth()
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [totalTorneios, setTotalTorneios] = useState<number>(0)

  useEffect(() => {
    if (!perfil?.is_admin) return
    Promise.all([
      supabase.from('perfis').select('*', { count: 'exact', head: true }),
      supabase.from('torneios').select('*', { count: 'exact', head: true }),
    ]).then(([{ count: u }, { count: t }]) => {
      setTotalUsers(u ?? 0)
      setTotalTorneios(t ?? 0)
    })
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
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: '32px', fontWeight: 700, marginBottom: 32 }}>Painel Admin</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Usuários', value: totalUsers, color: 'var(--color-blue-light)' },
            { label: 'Torneios', value: totalTorneios, color: 'var(--color-success)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Rajdhani', fontSize: '40px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { to: '/torneios/criar', icon: '🏆', title: 'Criar Torneio' },
            { to: '/admin/usuarios', icon: '👥', title: 'Gerenciar Usuários' },
            { to: '/admin/rankings', icon: '📊', title: 'Gerenciar Rankings' },
          ].map(item => (
            <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ textAlign: 'center', padding: '32px', cursor: 'pointer' }}>
                <div style={{ fontSize: '32px', marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontFamily: 'Rajdhani', fontSize: '18px' }}>{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
