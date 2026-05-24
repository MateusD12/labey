import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { Formato } from '@/types'

const TEMPLATES_KEY = 'labey_torneio_templates'

interface TorneioTemplate {
  id: string
  nome: string
  form: Record<string, string>
}

function loadTemplates(): TorneioTemplate[] {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? '[]') } catch { return [] }
}

function saveTemplates(ts: TorneioTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(ts))
}

const formatos: { value: Formato; label: string }[] = [
  { value: 'eliminatorio_simples', label: 'Eliminatório Simples' },
  { value: 'eliminatorio_duplo', label: 'Eliminatório Duplo' },
  { value: 'fase_grupos', label: 'Fase de Grupos' },
  { value: 'copa_do_mundo', label: 'Copa do Mundo' },
  { value: 'suico', label: 'Sistema Suíço' },
  { value: 'round_robin', label: 'Round Robin' },
]

const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: '14px' }
const labelStyle: React.CSSProperties = { fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }

export default function TorneiosCriar() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '', descricao: '', formato: 'eliminatorio_simples' as Formato,
    max_participantes: '', data_inicio: '', premio: '', regras: '',
    pontos_vitoria: '3', pontos_empate: '1', pontos_derrota: '0',
    num_grupos: '4', classificados_por_grupo: '2', num_rodadas_suico: '5', num_rodadas_grupo: '3',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [templates, setTemplates] = useState<TorneioTemplate[]>(loadTemplates)
  const [showTemplates, setShowTemplates] = useState(false)

  if (perfil && !perfil.is_admin) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: 60 }}>
        <h2 style={{ fontFamily: 'Rajdhani', fontSize: '24px', color: 'var(--color-danger)' }}>Acesso negado</h2>
      </div>
    </>
  )

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSaveTemplate = () => {
    const name = prompt('Nome do template:')
    if (!name) return
    const t: TorneioTemplate = { id: Date.now().toString(), nome: name, form: { ...form, nome: '' } }
    const updated = [...templates, t]
    saveTemplates(updated)
    setTemplates(updated)
  }

  const handleLoadTemplate = (t: TorneioTemplate) => {
    setForm(f => ({ ...f, ...t.form }))
    setShowTemplates(false)
  }

  const handleDeleteTemplate = (tid: string) => {
    const updated = templates.filter(t => t.id !== tid)
    saveTemplates(updated)
    setTemplates(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data, error: err } = await supabase.from('torneios').insert({
      nome: form.nome,
      descricao: form.descricao || null,
      formato: form.formato,
      max_participantes: form.max_participantes ? parseInt(form.max_participantes) : null,
      data_inicio: form.data_inicio || null,
      premio: form.premio || null,
      regras: form.regras || null,
      status: 'rascunho',
      pontos_vitoria: parseInt(form.pontos_vitoria) || 3,
      pontos_empate: parseInt(form.pontos_empate) || 1,
      pontos_derrota: parseInt(form.pontos_derrota) || 0,
      num_grupos: parseInt(form.num_grupos) || 4,
      classificados_por_grupo: parseInt(form.classificados_por_grupo) || 2,
      num_rodadas_suico: parseInt(form.num_rodadas_suico) || 5,
      num_rodadas_grupo: Math.min(4, Math.max(1, parseInt(form.num_rodadas_grupo) || 3)),
    }).select().single()
    if (err) { setError(err.message); setSaving(false); return }
    navigate(`/torneios/${data.id}/admin`)
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontSize: '32px', fontWeight: 700, margin: 0 }}>Criar Torneio</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {templates.length > 0 && (
              <button type="button" onClick={() => setShowTemplates(v => !v)} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13 }}>
                📂 Templates ({templates.length})
              </button>
            )}
            <button type="button" onClick={handleSaveTemplate} style={{ background: 'rgba(43,91,232,0.1)', border: '1px solid rgba(43,91,232,0.3)', color: 'var(--color-blue-light)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13 }}>
              💾 Salvar template
            </button>
          </div>
        </div>

        {showTemplates && templates.length > 0 && (
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16, marginBottom: 24 }}>
            <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10 }}>Clique para carregar um template:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {templates.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                  <button type="button" onClick={() => handleLoadTemplate(t)} style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, textAlign: 'left', flex: 1 }}>
                    {t.nome} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>— {t.form.formato}</span>
                  </button>
                  <button type="button" onClick={() => handleDeleteTemplate(t.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div><label style={labelStyle}>Nome do torneio *</label><input required value={form.nome} onChange={e => set('nome', e.target.value)} style={inputStyle} placeholder="Ex: LaBey Championship 2025" /></div>
          <div><label style={labelStyle}>Formato *</label><select value={form.formato} onChange={e => set('formato', e.target.value as Formato)} style={inputStyle}>{formatos.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={labelStyle}>Máx. participantes</label><input type="number" value={form.max_participantes} onChange={e => set('max_participantes', e.target.value)} style={inputStyle} placeholder="16" /></div>
            <div><label style={labelStyle}>Data de início</label><input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} style={inputStyle} /></div>
          </div>
          <div>
            <label style={labelStyle}>Pontuação</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div><label style={{ ...labelStyle, fontSize: '11px' }}>Vitória</label><input type="number" min="0" value={form.pontos_vitoria} onChange={e => set('pontos_vitoria', e.target.value)} style={inputStyle} /></div>
              <div><label style={{ ...labelStyle, fontSize: '11px' }}>Empate</label><input type="number" min="0" value={form.pontos_empate} onChange={e => set('pontos_empate', e.target.value)} style={inputStyle} /></div>
              <div><label style={{ ...labelStyle, fontSize: '11px' }}>Derrota</label><input type="number" min="0" value={form.pontos_derrota} onChange={e => set('pontos_derrota', e.target.value)} style={inputStyle} /></div>
            </div>
          </div>
          {(form.formato === 'fase_grupos' || form.formato === 'copa_do_mundo') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div><label style={labelStyle}>Número de grupos</label><input type="number" min="2" value={form.num_grupos} onChange={e => set('num_grupos', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Classificados por grupo</label><input type="number" min="1" max="4" value={form.classificados_por_grupo} onChange={e => set('classificados_por_grupo', e.target.value)} style={inputStyle} /></div>
              <div><label style={labelStyle}>Rodadas por grupo (1–4)</label><input type="number" min="1" max="4" value={form.num_rodadas_grupo} onChange={e => set('num_rodadas_grupo', e.target.value)} style={inputStyle} /></div>
            </div>
          )}
          {form.formato === 'suico' && (
            <div><label style={labelStyle}>Número de rodadas suíças</label><input type="number" min="1" value={form.num_rodadas_suico} onChange={e => set('num_rodadas_suico', e.target.value)} style={inputStyle} /></div>
          )}
          <div><label style={labelStyle}>Prêmio</label><input value={form.premio} onChange={e => set('premio', e.target.value)} style={inputStyle} placeholder="Ex: Troféu + Kit Beyblade" /></div>
          <div><label style={labelStyle}>Descrição</label><textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Descreva o torneio..." /></div>
          <div><label style={labelStyle}>Regras</label><textarea value={form.regras} onChange={e => set('regras', e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Regras especiais..." /></div>
          {error && <p style={{ color: 'var(--color-danger)', fontFamily: 'DM Sans', fontSize: '13px' }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px', fontSize: '15px' }}>{saving ? 'Criando...' : 'Criar torneio'}</button>
        </form>
      </main>
    </>
  )
}
