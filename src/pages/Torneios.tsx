import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { TorneiosLayout } from '@/components/torneio/TorneiosLayout'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { Torneio } from '@/types'

export default function Torneios() {
  const { perfil } = useAuth()
  const [torneios, setTorneios] = useState<Torneio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('torneios').select('*').order('data_inicio', { ascending: false })
      .then(({ data }) => { setTorneios((data ?? []) as Torneio[]); setLoading(false) })
  }, [])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</div>
    </>
  )

  return (
    <>
      <Navbar />
      <TorneiosLayout torneios={torneios} isAdmin={perfil?.is_admin ?? false} />
    </>
  )
}
