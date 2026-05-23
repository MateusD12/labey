import { useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPopup() {
  const [visible, setVisible] = useState(false)
  const [hiding, setHiding] = useState(false)
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as BeforeInstallPromptEvent
      if (!sessionStorage.getItem('pwa-dismissed')) setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setHiding(true)
    sessionStorage.setItem('pwa-dismissed', '1')
    setTimeout(() => { setVisible(false); setHiding(false) }, 380)
  }

  async function install() {
    if (!promptRef.current) return
    await promptRef.current.prompt()
    const { outcome } = await promptRef.current.userChoice
    if (outcome === 'accepted') { setVisible(false); promptRef.current = null }
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, width: 300, zIndex: 99999,
      borderRadius: 16, padding: '18px 18px 14px',
      background: 'linear-gradient(135deg, #0d0d1a, #131830)',
      border: '1px solid rgba(43,91,232,0.40)',
      boxShadow: '0 12px 40px rgba(0,0,0,.65), 0 0 0 1px rgba(43,91,232,.10)',
      animation: hiding ? 'pwaSlideOut .35s ease forwards' : 'pwaSlideIn .45s cubic-bezier(.22,.68,0,1.2) forwards',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <style>{`
        @keyframes pwaSlideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pwaSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <img src="/icon-192.png" alt="" style={{ width: 52, height: 52, borderRadius: 12, border: '1px solid rgba(43,91,232,0.4)', flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--color-blue-light)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            LaBey
          </div>
          <div style={{ fontSize: 11.5, color: '#8892a4', marginTop: 2, lineHeight: 1.4 }}>
            Instale o app no seu dispositivo<br />para acesso rápido e offline
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(43,91,232,.15)', marginBottom: 12 }} />

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={install} style={{
          flex: 1,
          background: 'linear-gradient(135deg, var(--color-blue-primary), #1a3da8)',
          color: '#fff', border: '1px solid rgba(43,91,232,.5)',
          borderRadius: 9, padding: '9px 14px',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13,
          textTransform: 'uppercase', letterSpacing: '1.5px', cursor: 'pointer',
        }}>
          Instalar App
        </button>
        <button onClick={dismiss} style={{
          background: 'transparent', color: '#8892a4',
          border: '1px solid rgba(136,146,164,.35)',
          borderRadius: 9, padding: '9px 12px', fontSize: 14, cursor: 'pointer',
        }}>
          ✕
        </button>
      </div>
    </div>
  )
}
