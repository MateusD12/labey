import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { PerfilCard } from '@/components/perfil/PerfilCard'
import { EstatisticasCard } from '@/components/perfil/EstatisticasCard'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { fetchUserDecks } from '@/lib/beyblades'
import { Badges } from '@/components/perfil/Badges'
import type { Perfil as PerfilType, EstatisticasBlade, Deck, Partida } from '@/types'

export default function Perfil() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<PerfilType | null>(null)
  const [stats, setStats] = useState<EstatisticasBlade | null>(null)
  const [decks, setDecks] = useState<Deck[]>([])
  const [h2h, setH2h] = useState<Partida[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('perfis').select('*').eq('id', id).single(),
      supabase.from('estatisticas_blades').select('*').eq('id', id).single(),
    ]).then(([{ data: p }, { data: s }]) => {
      if (!p) { setNotFound(true) } else { setPerfil(p as PerfilType) }
      if (s) setStats(s as EstatisticasBlade)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!id) return
    fetchUserDecks(id).then(setDecks).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!id || !user || user.id === id) return
    supabase.from('partidas')
      .select('id, blade1_id, blade2_id, vencedor_id, blade1_score, blade2_score, status, torneio:torneios(nome)')
      .in('status', ['finalizada', 'w.o.'])
      .or(`and(blade1_id.eq.${user.id},blade2_id.eq.${id}),and(blade1_id.eq.${id},blade2_id.eq.${user.id})`)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setH2h(data as unknown as Partida[]) })
  }, [id, user])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</div>
    </>
  )

  if (notFound) return <Navigate to="/" replace />

  const isOwn = user?.id === id

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div />
          {isOwn && (
            <Link to="/perfil/editar" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px', textDecoration: 'none', display: 'inline-block', borderRadius: 8 }}>
              Editar perfil
            </Link>
          )}
        </div>
        <style>{`
          .perfil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24; align-items: start; }
          @media (max-width: 600px) { .perfil-grid { grid-template-columns: 1fr; gap: 16px; } }
        `}</style>
        <div className="perfil-grid" style={{ display: 'grid', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {perfil && <PerfilCard perfil={perfil} />}
            {perfil?.beyblade_favorito && (
              <div className="card">
                <p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: '12px', marginBottom: 4 }}>Beyblade favorito</p>
                <p style={{ fontFamily: 'Rajdhani', fontSize: '18px', fontWeight: 700 }}>{perfil.beyblade_favorito}</p>
              </div>
            )}
            {stats && <Badges stats={stats} />}
          </div>
          {stats && <EstatisticasCard stats={stats} />}
        </div>

        {!isOwn && user && h2h.length > 0 && (() => {
          const myWins = h2h.filter(p => p.vencedor_id === user.id).length
          const theirWins = h2h.filter(p => p.vencedor_id === id).length
          const draws = h2h.filter(p => p.status === 'finalizada' && !p.vencedor_id).length
          return (
            <div style={{ marginTop: 32 }}>
              <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 22, color: 'var(--color-text-primary)', marginBottom: 4 }}>Confronto Direto</h2>
              <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Últimos {h2h.length} confrontos entre vocês</p>
              <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 36, color: myWins > theirWins ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{myWins}</div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>Você</div>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'Rajdhani', fontSize: 20 }}>
                  {draws > 0 && <div style={{ fontFamily: 'DM Sans', fontSize: 11, marginBottom: 2 }}>{draws} empate{draws > 1 ? 's' : ''}</div>}
                  vs
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 36, color: theirWins > myWins ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{theirWins}</div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>{perfil?.username}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {h2h.map(p => {
                  const iWon = p.vencedor_id === user.id
                  const theyWon = p.vencedor_id === id
                  const myScore = p.blade1_id === user.id ? p.blade1_score : p.blade2_score
                  const theirScore = p.blade1_id === id ? p.blade1_score : p.blade2_score
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: iWon ? 'rgba(34,197,94,0.06)' : theyWon ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${iWon ? 'rgba(34,197,94,0.15)' : theyWon ? 'rgba(239,68,68,0.15)' : 'var(--color-border)'}`, borderRadius: 8, padding: '8px 14px' }}>
                      <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>{(p as any).torneio?.nome ?? 'Torneio'}</span>
                      <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16 }}>
                        <span style={{ color: iWon ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{myScore ?? '-'}</span>
                        {' – '}
                        <span style={{ color: theyWon ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{theirScore ?? '-'}</span>
                      </span>
                      <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: iWon ? 'var(--color-success)' : theyWon ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                        {iWon ? 'Vitória' : theyWon ? 'Derrota' : 'Empate'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {decks.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 22, color: 'var(--color-text-primary)', marginBottom: 16 }}>
              Arsenal
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {decks.map(deck => {
                const totalW = deck.beyblades.reduce((s, b) => s + b.wins, 0)
                const totalL = deck.beyblades.reduce((s, b) => s + b.losses, 0)
                const wr = totalW + totalL > 0 ? Math.round((totalW / (totalW + totalL)) * 100) : null
                return (
                  <div key={deck.id} style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)', marginBottom: 4 }}>{deck.name}</div>
                    <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {deck.beyblades.length} beyblade{deck.beyblades.length !== 1 ? 's' : ''}
                      {wr !== null ? ` · ${wr}% WR` : ''}
                      {' · '}W {totalW} / L {totalL}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
