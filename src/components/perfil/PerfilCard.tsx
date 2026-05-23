import type { Perfil } from '@/types'
import { MapPin } from 'lucide-react'

export function PerfilCard({ perfil }: { perfil: Perfil }) {
  return (
    <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      {perfil.avatar_url
        ? <img src={perfil.avatar_url} alt={perfil.nome_display} style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid var(--color-blue-primary)', flexShrink: 0 }} />
        : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '28px', color: '#fff', flexShrink: 0 }}>
            {perfil.nome_display[0]?.toUpperCase()}
          </div>
      }
      <div>
        <h2 style={{ fontFamily: 'Rajdhani', fontSize: '22px', fontWeight: 700 }}>{perfil.nome_display}</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontFamily: 'DM Sans' }}>@{perfil.username}</p>
        {(perfil.cidade || perfil.estado) && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <MapPin size={12} />{[perfil.cidade, perfil.estado].filter(Boolean).join(', ')}
          </p>
        )}
        {perfil.bio && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontFamily: 'DM Sans', marginTop: 6, lineHeight: 1.5 }}>{perfil.bio}</p>}
      </div>
    </div>
  )
}
