import { useState, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import type { BeybladeRow } from '@/types'

interface AddPartModalProps {
  onClose: () => void
  onSave: (part: Omit<BeybladeRow, 'id'>, file?: File) => Promise<void>
}

const GERACOES = ['BX', 'UX', 'CX', 'CX Expend', 'Burst', 'MFB']
const TIPOS = ['Blade', 'Assist Blade', 'Main Blade', 'Metal Blade', 'Over Blade', 'Lock Chip', 'Ratchet', 'Bit']

export function AddPartModal({ onClose, onSave }: AddPartModalProps) {
  const [form, setForm] = useState<Omit<BeybladeRow, 'id'>>({
    geracao: '', serie: '', peca: '', tipo: '', beyblade: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.geracao || !form.tipo || !form.peca || !form.beyblade) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(form, file ?? undefined)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--color-bg-primary)', borderRadius: 14,
        padding: 24, width: '100%', maxWidth: 440,
        border: '1px solid var(--color-border)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: 'var(--color-text-primary)' }}>
            Adicionar Peça
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Geração *">
              <select value={form.geracao} onChange={e => set('geracao', e.target.value)} required>
                <option value="">Selecione</option>
                {GERACOES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Tipo *">
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} required>
                <option value="">Selecione</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Nome da Peça *">
            <input type="text" value={form.peca} onChange={e => set('peca', e.target.value)} placeholder="ex: Dran Sword" required />
          </Field>

          <Field label="Beyblade *">
            <input type="text" value={form.beyblade} onChange={e => set('beyblade', e.target.value)} placeholder="ex: Dran Sword 3-60F" required />
          </Field>

          <Field label="Série">
            <input type="text" value={form.serie} onChange={e => set('serie', e.target.value)} placeholder="ex: Starter" />
          </Field>

          <div>
            <label style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
              Foto (opcional)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed var(--color-border)', borderRadius: 10,
                padding: 16, cursor: 'pointer', textAlign: 'center',
                background: 'var(--color-bg-secondary)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}
            >
              {preview
                ? <img src={preview} alt="preview" style={{ maxHeight: 100, borderRadius: 6, objectFit: 'contain' }} />
                : <><Upload size={20} color="var(--color-text-muted)" /><span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>Clique para selecionar</span></>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </div>

          {error && <div style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#ef4444' }}>{error}</div>}

          <button type="submit" disabled={saving} style={{
            background: 'var(--color-blue-primary)', color: '#fff', border: 'none',
            padding: '12px', borderRadius: 9, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans', fontWeight: 600, fontSize: 15, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Salvando...' : 'Salvar Peça'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ '--field-input': '1' } as React.CSSProperties}>
        <style>{`
          [style*="--field-input"] select,
          [style*="--field-input"] input {
            width: 100%;
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            padding: 9px 12px;
            color: var(--color-text-primary);
            font-family: DM Sans;
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
          }
          [style*="--field-input"] select:focus,
          [style*="--field-input"] input:focus {
            border-color: var(--color-blue-primary);
          }
        `}</style>
        {children}
      </div>
    </div>
  )
}
