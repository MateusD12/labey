import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: '14px' }
const labelStyle: React.CSSProperties = { fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }

export default function PerfilEditar() {
  const { user, perfil } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', nome_display: '', avatar_url: '', bio: '', cidade: '', estado: '', beyblade_favorito: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (perfil) setForm({
      username: perfil.username,
      nome_display: perfil.nome_display,
      avatar_url: perfil.avatar_url ?? '',
      bio: perfil.bio ?? '',
      cidade: perfil.cidade ?? '',
      estado: perfil.estado ?? '',
      beyblade_favorito: perfil.beyblade_favorito ?? '',
    })
  }, [perfil])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('perfis').update(form).eq('id', user.id)
    setSaving(false)
    if (error) setMsg(`Erro: ${error.message}`)
    else { setMsg('Perfil atualizado!'); navigate(`/perfil/${user.id}`) }
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: '28px', fontWeight: 700, marginBottom: 32 }}>Editar Perfil</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Foto de perfil</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
              {form.avatar_url
                ? <img src={form.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid var(--color-blue-primary)', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '24px', color: '#fff' }}>
                    {form.nome_display?.[0]?.toUpperCase() ?? '?'}
                  </div>
              }
              <div style={{ flex: 1 }}>
                <input value={form.avatar_url} onChange={e => set('avatar_url', e.target.value)} placeholder="URL da imagem (deixe em branco para usar inicial)" style={inputStyle} />
                <p style={{ fontFamily: 'DM Sans', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 4 }}>Cole a URL da sua foto. O Google preencheu automaticamente ao criar a conta.</p>
              </div>
            </div>
          </div>

          <div><label style={labelStyle}>Nome de exibição</label><input required value={form.nome_display} onChange={e => set('nome_display', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Username</label><input required value={form.username} onChange={e => set('username', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Bio</label><textarea value={form.bio} onChange={e => set('bio', e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={labelStyle}>Cidade</label><input value={form.cidade} onChange={e => set('cidade', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Estado</label><input value={form.estado} onChange={e => set('estado', e.target.value)} style={inputStyle} placeholder="SP" /></div>
          </div>
          <div><label style={labelStyle}>Beyblade favorito</label><input value={form.beyblade_favorito} onChange={e => set('beyblade_favorito', e.target.value)} style={inputStyle} /></div>

          {msg && <p style={{ color: msg.startsWith('Erro') ? 'var(--color-danger)' : 'var(--color-success)', fontFamily: 'DM Sans', fontSize: '13px' }}>{msg}</p>}
          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px', fontSize: '15px' }}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </main>
    </>
  )
}
