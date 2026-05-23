import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { formatFormato } from '@/lib/utils'
import type { Ranking, Torneio } from '@/types'

interface RankingComTorneios extends Ranking {
  torneios: Torneio[]
}

const STATUS_LABEL: Record<string, string> = {
  em_andamento: 'Em andamento',
  inscricoes: 'Inscrições',
  rascunho: 'Rascunho',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  em_andamento: 'var(--color-blue-light)',
  inscricoes: 'var(--color-success)',
  rascunho: 'var(--color-warning)',
  finalizado: 'var(--color-text-muted)',
  cancelado: 'var(--color-danger)',
}

export default function AdminRankings() {
  const { perfil, loading } = useAuth()
  const [rankings, setRankings] = useState<RankingComTorneios[]>([])
  const [allTorneios, setAllTorneios] = useState<Torneio[]>([])
  const [nome, setNome] = useState('')
  const [temporada, setTemporada] = useState('')
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [{ data: rks }, { data: tornAll }] = await Promise.all([
      supabase.from('rankings').select('*').order('created_at', { ascending: false }),
      supabase.from('torneios').select('*').order('data_inicio', { ascending: false }),
    ])
    const allT = (tornAll ?? []) as Torneio[]
    setAllTorneios(allT)
    if (!rks) return
    const withT = await Promise.all(rks.map(async (r) => {
      const { data: rt } = await supabase.from('ranking_torneios').select('torneio_id').eq('ranking_id', r.id)
      const ids = (rt ?? []).map((x: { torneio_id: string }) => x.torneio_id)
      return { ...r, torneios: allT.filter(t => ids.includes(t.id)) }
    }))
    setRankings(withT)
  }, [])

  useEffect(() => { if (perfil?.is_admin) load() }, [perfil, load])

  const criar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('rankings').insert({ nome, temporada: temporada || null, ativo: true })
    setNome(''); setTemporada('')
    await load()
    setSaving(false)
  }

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from('rankings').update({ ativo: !ativo }).eq('id', id)
    await load()
  }

  const linkTorneio = async (rankingId: string, torneioId: string) => {
    await supabase.from('ranking_torneios').insert({ ranking_id: rankingId, torneio_id: torneioId })
    await load()
  }

  const unlinkTorneio = async (rankingId: string, torneioId: string) => {
    await supabase.from('ranking_torneios').delete().eq('ranking_id', rankingId).eq('torneio_id', torneioId)
    await load()
  }

  const recalcular = async (rankingId: string) => {
    setRecalculating(rankingId)
    await supabase.rpc('recalcular_ranking', { p_ranking_id: rankingId })
    setRecalculating(null)
    await load()
  }

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</div>
    </>
  )

  if (!perfil?.is_admin) return <Navigate to="/" replace />

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Gerenciar Rankings</h1>

        <form onSubmit={criar} style={{ display: 'flex', gap: 12, marginBottom: 36, flexWrap: 'wrap', padding: '20px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
          <input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do ranking" style={{ flex: 1, minWidth: 200, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 14 }} />
          <input value={temporada} onChange={e => setTemporada(e.target.value)} placeholder="Temporada (ex: 2025)" style={{ width: 160, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 14 }} />
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Criando...' : '+ Criar Ranking'}</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rankings.map(r => {
            const isExpanded = expanded === r.id
            const linkedIds = r.torneios.map(t => t.id)
            const available = allTorneios.filter(t => !linkedIds.includes(t.id))
            return (
              <div key={r.id} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                  <button onClick={() => setExpanded(isExpanded ? null : r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
                    <span style={{ fontFamily: 'Rajdhani', fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.nome}</span>
                    {r.temporada && <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10 }}>{r.temporada}</span>}
                    <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)' }}>{r.torneios.length} torneio{r.torneios.length !== 1 ? 's' : ''}</span>
                    <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
                  </button>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => recalcular(r.id)} disabled={recalculating === r.id} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(43,91,232,0.2)', color: 'var(--color-blue-light)', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, opacity: recalculating === r.id ? 0.6 : 1 }}>
                      {recalculating === r.id ? '⟳ Recalculando...' : '⟳ Recalcular'}
                    </button>
                    <button onClick={() => toggleAtivo(r.id, r.ativo)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: r.ativo ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: r.ativo ? 'var(--color-success)' : 'var(--color-danger)', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600 }}>
                      {r.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <p style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Torneios vinculados</p>
                      {r.torneios.length === 0
                        ? <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)' }}>Nenhum torneio vinculado ainda.</p>
                        : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {r.torneios.map(t => (
                              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[t.status] ?? 'var(--color-text-muted)' }} />
                                  <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-primary)' }}>{t.nome}</span>
                                  <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)' }}>{formatFormato(t.formato)} · {STATUS_LABEL[t.status] ?? t.status}</span>
                                </div>
                                <button onClick={() => unlinkTorneio(r.id, t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: 13, padding: '2px 6px', borderRadius: 4 }} title="Desvincular">✕</button>
                              </div>
                            ))}
                          </div>
                        )
                      }
                    </div>

                    {available.length > 0 && (
                      <div>
                        <p style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Adicionar torneio</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {available.map(t => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: STATUS_COLOR[t.status] ?? 'var(--color-text-muted)', opacity: 0.5 }} />
                                <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-secondary)' }}>{t.nome}</span>
                                <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)' }}>{formatFormato(t.formato)} · {STATUS_LABEL[t.status] ?? t.status}</span>
                              </div>
                              <button onClick={() => linkTorneio(r.id, t.id)} style={{ background: 'rgba(43,91,232,0.15)', border: 'none', cursor: 'pointer', color: 'var(--color-blue-light)', fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}>+ Vincular</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}
