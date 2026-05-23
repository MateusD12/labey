import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [user, loading, navigate])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--color-bg-primary)', backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(43,91,232,0.10) 0%, transparent 60%)' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/logo.png" alt="LaBey" style={{ height: 48, objectFit: 'contain', marginBottom: 20 }} />
          <h1 style={{ fontFamily: 'Rajdhani', fontSize: '28px', fontWeight: 700, marginBottom: 8 }}>Bem-vindo ao LaBey</h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Entre com sua conta Google para participar de torneios e subir no ranking.
          </p>
        </div>
        <div className="card" style={{ padding: '28px 24px' }}>
          <GoogleLoginButton />
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'DM Sans', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Ao entrar, você concorda com os termos de uso do LaBey.
        </p>
      </div>
    </div>
  )
}
