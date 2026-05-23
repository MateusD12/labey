import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { PerfilCard } from '@/components/perfil/PerfilCard'
import { EstatisticasCard } from '@/components/perfil/EstatisticasCard'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { Perfil as PerfilType, EstatisticasBlade } from '@/types'

export default function Perfil() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<PerfilType | null>(null)
  const [stats, setStats] = useState<EstatisticasBlade | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('perfis').select('*').eq('id', id).single(),
      supabase.from('estatisticas_blades').select('*').eq('id', id).single(),
    ]).then(([{ data: p }, { data: s }]) => {
      if (!p) { setNotFound(true) } else { setPerfil(p as PerfilType) }
      if (s) setStats(s as EstatisticasBlade)
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</div>
    </>
  )

  if (notFound) return <Navigate to="/" replace />

  const isOwn = user?.id === id

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div />
          {isOwn && (
            <Link to="/perfil/editar" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px', textDecoration: 'none', display: 'inline-block', borderRadius: 8 }}>
              Editar perfil
            </Link>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {perfil && <PerfilCard perfil={perfil} />}
            {perfil?.beyblade_favorito && (
              <div className="card">
                <p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: '12px', marginBottom: 4 }}>Beyblade favorito</p>
                <p style={{ fontFamily: 'Rajdhani', fontSize: '18px', fontWeight: 700 }}>{perfil.beyblade_favorito}</p>
              </div>
            )}
          </div>
          {stats && <EstatisticasCard stats={stats} />}
        </div>
      </main>
    </>
  )
}
