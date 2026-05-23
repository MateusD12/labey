import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Bell } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { requestPermission } from '@/hooks/usePushNotifications'

const NAV_LINKS = [
  { to: '/torneios',   label: 'Torneios' },
  { to: '/rankings',   label: 'Rankings' },
  { to: '/bladers',    label: 'Bladers' },
  { to: '/comunidade', label: 'Comunidade' },
]

export function Navbar() {
  const { user, perfil, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const notifSupported = typeof window !== 'undefined' && 'Notification' in window
  const notifGranted = notifSupported && Notification.permission === 'granted'

  return (
    <>
      <style>{`
        .nb-links   { display:flex; gap:20px; align-items:center; }
        .nb-right   { display:flex; gap:14px; align-items:center; justify-content:flex-end; }
        .nb-burger  { display:none; }
        .nb-avatar  { display:none; }
        .nb-grid    { grid-template-columns: 1fr auto 1fr; padding: 0 24px; }
        @media(max-width:768px){
          .nb-links  { display:none; }
          .nb-right  { display:none; }
          .nb-burger { display:flex; align-items:center; }
          .nb-avatar { display:flex; align-items:center; justify-content:flex-end; }
          .nb-grid   { grid-template-columns: auto 1fr auto; padding: 0 16px; }
        }
      `}</style>

      <nav className="nb-grid" style={{
        background: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        height: '60px',
        display: 'grid',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>
        <div>
          <div className="nb-links">
            {NAV_LINKS.map(l => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
          </div>
          <button className="nb-burger" onClick={() => setOpen(o => !o)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-primary)', padding: '4px',
          }}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <Link to="/" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="LaBey" style={{ height: 32, objectFit: 'contain', display: 'block' }} />
        </Link>

        <div>
          <div className="nb-right">
            {user ? (
              <>
                {perfil?.is_admin && (
                  <Link to="/admin" style={{ color: 'var(--color-blue-light)', fontFamily: 'DM Sans', fontSize: '14px', fontWeight: 600 }}>Admin</Link>
                )}
                {notifSupported && !notifGranted && (
                  <button onClick={() => requestPermission(user.id)} title="Ativar notificacoes" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, display: 'flex', alignItems: 'center' }}>
                    <Bell size={18} />
                  </button>
                )}
                <Link to={`/perfil/${perfil?.id}`}>
                  <UserAvatar perfil={perfil} size={32} />
                </Link>
                <button onClick={signOut} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px' }}>
                  Sair
                </button>
              </>
            ) : (
              <Link to="/login" style={{ background: 'var(--color-blue-primary)', color: '#fff', padding: '7px 16px', borderRadius: '8px', fontFamily: 'DM Sans', fontWeight: 500, fontSize: '14px' }}>
                Entrar
              </Link>
            )}
          </div>

          <div className="nb-avatar">
            {user ? (
              <Link to={`/perfil/${perfil?.id}`} onClick={() => setOpen(false)}>
                <UserAvatar perfil={perfil} size={32} />
              </Link>
            ) : (
              <Link to="/login" style={{ background: 'var(--color-blue-primary)', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontFamily: 'DM Sans', fontWeight: 500, fontSize: '13px' }}>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </nav>

      {open && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
          background: 'var(--color-bg-primary)', zIndex: 199,
          display: 'flex', flexDirection: 'column',
          borderTop: '1px solid var(--color-border)',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '8px 0' }}>
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} style={{
                display: 'block', padding: '16px 24px',
                fontFamily: 'DM Sans', fontSize: 17, fontWeight: 500,
                color: 'var(--color-text-primary)', textDecoration: 'none',
                borderBottom: '1px solid var(--color-border)',
              }}>
                {l.label}
              </Link>
            ))}
            {perfil?.is_admin && (
              <Link to="/admin" onClick={() => setOpen(false)} style={{
                display: 'block', padding: '16px 24px',
                fontFamily: 'DM Sans', fontSize: 17, fontWeight: 600,
                color: 'var(--color-blue-light)', textDecoration: 'none',
                borderBottom: '1px solid var(--color-border)',
              }}>
                Admin
              </Link>
            )}
          </div>

          <div style={{ padding: '20px 24px', marginTop: 'auto', borderTop: '1px solid var(--color-border)' }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link to={`/perfil/${perfil?.id}`} onClick={() => setOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                }}>
                  <UserAvatar perfil={perfil} size={40} />
                  <div>
                    <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>
                      {perfil?.nome_display}
                    </div>
                    <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>
                      @{perfil?.username}
                    </div>
                  </div>
                </Link>
                <button onClick={() => { signOut(); setOpen(false) }} style={{
                  background: 'none', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)', padding: '12px',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '15px',
                }}>
                  Sair
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} style={{
                display: 'block', background: 'var(--color-blue-primary)', color: '#fff',
                padding: '14px', borderRadius: '8px', fontFamily: 'DM Sans',
                fontWeight: 600, fontSize: '16px', textAlign: 'center', textDecoration: 'none',
              }}>
                Entrar com Google
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function UserAvatar({ perfil, size }: { perfil: { avatar_url?: string; nome_display?: string } | null; size: number }) {
  if (perfil?.avatar_url) {
    return <img src={perfil.avatar_url} alt={perfil.nome_display} style={{ width: size, height: size, borderRadius: '50%', border: '2px solid var(--color-blue-primary)', display: 'block', objectFit: 'cover' }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani', fontWeight: 700, color: '#fff', fontSize: Math.round(size * 0.44), flexShrink: 0 }}>
      {perfil?.nome_display?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: '14px', transition: 'color 0.2s', whiteSpace: 'nowrap', textDecoration: 'none' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}>
      {children}
    </Link>
  )
}
