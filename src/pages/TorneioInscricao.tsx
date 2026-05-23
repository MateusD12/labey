import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function TorneioInscricao() {
  const { id } = useParams<{ id: string }>()
  const { user, perfil } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleInscrever = async () => {
    if (!user) { navigate('/login'); return }
    setLoading(true)
    const { error: err } = await supabase.from('inscricoes').insert({ torneio_id: id, blade_id: user.id })
    if (err) setError(err.message)
    else setDone(true)
    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '40px', marginBottom: 20 }}>🏆</div>
          <h1 style={{ fontFamily: 'Rajdhani', fontSize: '28px', fontWeight: 700, marginBottom: 12 }}>Inscrição no Torneio</h1>
          {done ? (
            <>
              <p style={{ color: 'var(--color-success)', fontFamily: 'DM Sans', fontSize: '15px', marginBottom: 20 }}>✅ Inscrição realizada! Aguarde aprovação.</p>
              <button onClick={() => navigate(`/torneios/${id}`)} className="btn-primary">Ver torneio</button>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: '14px', marginBottom: 12 }}>Participando como:</p>
              <p style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700, marginBottom: 32 }}>{perfil?.nome_display ?? 'Carregando...'}</p>
              {error && <p style={{ color: 'var(--color-danger)', fontFamily: 'DM Sans', fontSize: '13px', marginBottom: 16 }}>{error}</p>}
              <button onClick={handleInscrever} disabled={loading || !user} className="btn-primary" style={{ width: '100%' }}>
                {loading ? 'Enviando...' : 'Confirmar inscrição'}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  )
}
