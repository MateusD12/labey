import { useState, useEffect } from 'react'
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
  const [isWaitlist, setIsWaitlist] = useState(false)
  const [error, setError] = useState('')
  const [maxParticipantes, setMaxParticipantes] = useState<number | null>(null)
  const [approvedCount, setApprovedCount] = useState(0)
  const [loadingInfo, setLoadingInfo] = useState(true)

  useEffect(() => {
    async function fetchInfo() {
      const [torneioRes, countRes] = await Promise.all([
        supabase.from('torneios').select('max_participantes').eq('id', id!).single(),
        supabase.from('inscricoes').select('id', { count: 'exact' }).eq('torneio_id', id!).eq('status', 'aprovado'),
      ])
      setMaxParticipantes(torneioRes.data?.max_participantes ?? null)
      setApprovedCount(countRes.count ?? 0)
      setLoadingInfo(false)
    }
    fetchInfo()
  }, [id])

  const isFull = maxParticipantes !== null && approvedCount >= maxParticipantes

  const handleInscrever = async () => {
    if (!user) { navigate('/login'); return }
    setLoading(true)
    const status = isFull ? 'lista_espera' : 'pendente'
    const { error: err } = await supabase.from('inscricoes').insert({ torneio_id: id, blade_id: user.id, status })
    if (err) setError(err.message)
    else { setDone(true); setIsWaitlist(isFull) }
    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '40px', marginBottom: 20 }}>{isFull && !done ? '⏳' : '🏆'}</div>
          <h1 style={{ fontFamily: 'Rajdhani', fontSize: '28px', fontWeight: 700, marginBottom: 12 }}>Inscrição no Torneio</h1>
          {loadingInfo ? (
            <p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: '14px' }}>Carregando...</p>
          ) : done ? (
            <>
              {isWaitlist ? (
                <p style={{ color: 'var(--color-warning)', fontFamily: 'DM Sans', fontSize: '15px', marginBottom: 20 }}>
                  ⏳ Torneio lotado! Você entrou na <strong>fila de espera</strong>. Será notificado se uma vaga abrir.
                </p>
              ) : (
                <p style={{ color: 'var(--color-success)', fontFamily: 'DM Sans', fontSize: '15px', marginBottom: 20 }}>
                  ✅ Inscrição realizada! Aguarde aprovação.
                </p>
              )}
              <button onClick={() => navigate(`/torneios/${id}`)} className="btn-primary">Ver torneio</button>
            </>
          ) : (
            <>
              {isFull && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 20 }}>
                  <p style={{ color: 'var(--color-warning)', fontFamily: 'DM Sans', fontSize: '13px', margin: 0 }}>
                    ⚠️ Este torneio está lotado ({approvedCount}/{maxParticipantes}). Você será inscrito na <strong>fila de espera</strong>.
                  </p>
                </div>
              )}
              <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: '14px', marginBottom: 12 }}>Participando como:</p>
              <p style={{ fontFamily: 'Rajdhani', fontSize: '20px', fontWeight: 700, marginBottom: 32 }}>{perfil?.nome_display ?? 'Carregando...'}</p>
              {error && <p style={{ color: 'var(--color-danger)', fontFamily: 'DM Sans', fontSize: '13px', marginBottom: 16 }}>{error}</p>}
              <button onClick={handleInscrever} disabled={loading || !user} className="btn-primary" style={{ width: '100%' }}>
                {loading ? 'Enviando...' : isFull ? 'Entrar na Fila de Espera' : 'Confirmar inscrição'}
              </button>
            </>
          )}
        </div>
      </main>
    </>
  )
}
