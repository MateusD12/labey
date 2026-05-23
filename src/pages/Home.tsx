import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { AppPresentacaoModal } from '@/components/layout/AppPresentacaoModal'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { Torneio, EstatisticasBlade } from '@/types'

const STATUS_COLOR: Record<string, string> = {
  em_andamento: 'var(--color-blue-light)',
  inscricoes:   'var(--color-success)',
  finalizado:   'var(--color-text-muted)',
}
const STATUS_LABEL: Record<string, string> = {
  em_andamento: 'Ao vivo',
  inscricoes:   'Inscrições abertas',
  finalizado:   'Finalizado',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'Rajdhani', fontSize: 16, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
      {children}
    </h2>
  )
}

function TorneioRow({ t }: { t: Torneio }) {
  return (
    <Link to={`/torneios/${t.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'border-color 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-blue-primary)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nome}</p>
          {t.data_inicio && <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{new Date(t.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
        </div>
        <span style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, flexShrink: 0, color: STATUS_COLOR[t.status] ?? 'var(--color-text-muted)', background: `${STATUS_COLOR[t.status] ?? '#fff'}18`, padding: '3px 10px', borderRadius: 20 }}>
          {STATUS_LABEL[t.status] ?? t.status}
        </span>
      </div>
    </Link>
  )
}

function QuickCard({ to, icon, title, desc, highlight }: { to: string; icon: string; title: string; desc: string; highlight?: boolean }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '16px 12px', textAlign: 'center', border: highlight ? '1px solid var(--color-blue-primary)' : '1px solid var(--color-border)', background: highlight ? 'rgba(43,91,232,0.07)' : 'var(--color-bg-card)', transition: 'transform 0.15s', cursor: 'pointer' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
        <h3 style={{ fontFamily: 'Rajdhani', fontSize: 16, fontWeight: 700, marginBottom: 4, color: highlight ? 'var(--color-blue-light)' : 'var(--color-text-primary)' }}>{title}</h3>
        <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{desc}</p>
      </div>
    </Link>
  )
}

function HomePublica({ onShowPitch }: { onShowPitch: () => void }) {
  return (
    <main style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--color-bg-primary)', backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(43,91,232,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(43,91,232,0.05) 0%, transparent 40%)' }}>
      <style>{`
        @keyframes lp-glow { 0%,100% { box-shadow: 0 0 20px rgba(43,91,232,0.3), inset 0 0 20px rgba(43,91,232,0.05) } 50% { box-shadow: 0 0 40px rgba(43,91,232,0.55), inset 0 0 30px rgba(43,91,232,0.1) } }
        @keyframes lp-arrow { 0%,100% { transform: translateX(0) } 50% { transform: translateX(5px) } }
        .lp-pitch-btn:hover .lp-arrow { animation: lp-arrow 0.7s ease infinite; }
        .lp-pitch-btn:hover { border-color: rgba(43,91,232,0.7) !important; background: rgba(43,91,232,0.1) !important; }
      `}</style>

      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center' }}>
        <img src="/logo.png" alt="LaBey" style={{ maxWidth: 300, width: '100%', display: 'block', margin: '0 auto 40px', objectFit: 'contain' }} />
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: 'clamp(36px, 6vw, 62px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 20, background: 'linear-gradient(135deg, #fff 0%, var(--color-blue-light) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          A arena oficial dos<br />Bladers brasileiros
        </h1>
        <p style={{ fontFamily: 'DM Sans', fontSize: 17, color: 'var(--color-text-secondary)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Participe de torneios, suba no ranking e prove quem é o melhor Blade do Brasil.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/torneios" className="btn-primary" style={{ padding: '13px 32px', fontSize: 16, borderRadius: 10, display: 'inline-block', boxShadow: '0 0 30px var(--color-blue-glow)', textDecoration: 'none' }}>
            Ver Torneios
          </Link>
          <Link to="/login" style={{ padding: '13px 32px', fontSize: 16, borderRadius: 10, display: 'inline-block', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontWeight: 500, textDecoration: 'none' }}>
            Criar conta
          </Link>
        </div>
      </section>

      {/* "O que o app faz?" card */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 44px' }}>
        <button
          onClick={onShowPitch}
          className="lp-pitch-btn"
          style={{
            width: '100%', cursor: 'pointer', border: '1px solid rgba(43,91,232,0.35)',
            borderRadius: 16, background: 'rgba(43,91,232,0.06)',
            padding: '22px 28px', textAlign: 'left',
            animation: 'lp-glow 3s ease infinite',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg, rgba(43,91,232,0.4), rgba(99,102,241,0.3))', border: '1px solid rgba(43,91,232,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                🚀
              </div>
              <div>
                <p style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 3 }}>O que o LaBey faz?</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                  Conheça todas as funcionalidades da plataforma — torneios, rankings, notificações e muito mais.
                </p>
              </div>
            </div>
            <div className="lp-arrow" style={{ color: 'var(--color-blue-light)', fontSize: 20, flexShrink: 0, fontFamily: 'DM Sans' }}>→</div>
          </div>
        </button>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {[
          { icon: '🏆', title: 'Torneios Oficiais', desc: 'Eliminatório, Suíço, Fase de Grupos, Round Robin e Copa do Mundo.' },
          { icon: '📊', title: 'Rankings em Tempo Real', desc: 'Sua posição atualizada após cada batalha, com histórico completo.' },
          { icon: '⚡', title: 'Brackets ao Vivo', desc: 'Acompanhe cada rodada em tempo real direto do celular.' },
        ].map(f => (
          <div key={f.title} className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
            <h3 style={{ fontFamily: 'Rajdhani', fontSize: 20, marginBottom: 8 }}>{f.title}</h3>
            <p style={{ fontFamily: 'DM Sans', fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}

function HomeDashboard({ nomeDisplay, torneios, topBladers, onShowPitch }: { nomeDisplay: string; torneios: Torneio[]; topBladers: EstatisticasBlade[]; onShowPitch: () => void }) {
  const ativos     = torneios.filter(t => t.status === 'em_andamento')
  const inscricoes = torneios.filter(t => t.status === 'inscricoes')
  const recentes   = torneios.filter(t => t.status === 'finalizado').slice(0, 3)

  const noticias = [
    { emoji: '📰', titulo: 'Beyblade X conquista novo recorde de vendas no Japão', data: 'Mai 2025', desc: 'A linha BX bateu 10 milhões de unidades vendidas mundialmente, consolidando a nova geração.' },
    { emoji: '🌍', titulo: 'WBO anuncia campeonato mundial Beyblade X para 2025', data: 'Abr 2025', desc: 'O torneio reunirá os melhores Bladers de mais de 40 países em Tokyo, novembro de 2025.' },
    { emoji: '🆕', titulo: 'Novos lançamentos: Garuda Phoenix e Dark Matter chegam ao Brasil', data: 'Mar 2025', desc: 'As esperadas Blades da linha UX finalmente disponíveis nas lojas brasileiras.' },
    { emoji: '🏆', titulo: 'Cobra Hammerhead domina o meta competitivo na América do Sul', data: 'Fev 2025', desc: 'O combo Cobalt Drake 4-80 Flat tem sido o favorito nos torneios regionais da temporada.' },
  ]

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 60px' }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 700, marginBottom: 4 }}>
          Bem-vindo de volta, {nomeDisplay}! ⚡
        </h1>
        <p style={{ fontFamily: 'DM Sans', fontSize: 14, color: 'var(--color-text-muted)' }}>Aqui está o resumo do LaBey hoje.</p>
      </div>

      <section style={{ marginBottom: 44 }}>
        <SectionLabel>Acesso rápido</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          <QuickCard to="/torneios"      icon="⚔️"  title="Torneios"    desc="Torneios ativos e histórico"  highlight />
          <QuickCard to="/rankings"      icon="📊"  title="Rankings"    desc="Sua posição no ranking" />
          <QuickCard to="/bladers"       icon="👤"  title="Bladers"     desc="Perfis e winrates" />
          <QuickCard to="/colecao"       icon="🗂️"  title="Arsenal"     desc="Decks e coleção" />
          <QuickCard to="/perfil/editar" icon="✏️"  title="Meu Perfil"  desc="Edite seu perfil" />
        </div>
        <div style={{ marginTop: 14 }}>
          <button
            onClick={onShowPitch}
            style={{
              width: '100%', cursor: 'pointer', border: '1px solid rgba(43,91,232,0.3)',
              borderRadius: 12, background: 'rgba(43,91,232,0.05)', padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(43,91,232,0.1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(43,91,232,0.6)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(43,91,232,0.05)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(43,91,232,0.3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🚀</span>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: 'Rajdhani', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 1 }}>O que o LaBey faz?</p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Todas as funcionalidades da plataforma</p>
              </div>
            </div>
            <span style={{ color: 'var(--color-blue-light)', fontSize: 16 }}>→</span>
          </button>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {ativos.length > 0 && (
            <section>
              <SectionLabel>🔴 Acontecendo agora</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ativos.map(t => <TorneioRow key={t.id} t={t} />)}
              </div>
            </section>
          )}
          {inscricoes.length > 0 && (
            <section>
              <SectionLabel>📋 Inscrições abertas</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {inscricoes.map(t => <TorneioRow key={t.id} t={t} />)}
              </div>
            </section>
          )}
          {recentes.length > 0 && (
            <section>
              <SectionLabel>🏁 Torneios recentes</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentes.map(t => <TorneioRow key={t.id} t={t} />)}
              </div>
            </section>
          )}
          {ativos.length === 0 && inscricoes.length === 0 && recentes.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 13 }}>
              Nenhum torneio ativo no momento.{' '}
              <Link to="/torneios" style={{ color: 'var(--color-blue-light)' }}>Ver todos →</Link>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {topBladers.length > 0 && (
            <section>
              <SectionLabel>🥇 Top Bladers</SectionLabel>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {topBladers.slice(0, 5).map((b, i) => {
                  const total = b.total_vitorias + b.total_derrotas
                  const wr = total === 0 ? 0 : Math.round(b.total_vitorias / total * 100)
                  const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }
                  return (
                    <Link key={b.id} to={`/perfil/${b.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-secondary)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontFamily: 'Rajdhani', fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{medals[i] ?? `#${i + 1}`}</span>
                        {b.avatar_url
                          ? <img src={b.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} alt="" />
                          : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>{b.nome_display?.[0]?.toUpperCase() ?? '?'}</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.nome_display}</p>
                          <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)' }}>@{b.username}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontFamily: 'Rajdhani', fontSize: 15, fontWeight: 700, color: 'var(--color-success)' }}>{b.total_vitorias}V</p>
                          <p style={{ fontFamily: 'DM Sans', fontSize: 10, color: 'var(--color-text-muted)' }}>{wr}% WR</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)' }}>
                  <Link to="/bladers" style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-blue-light)' }}>Ver todos os Bladers →</Link>
                </div>
              </div>
            </section>
          )}

          <section>
            <SectionLabel>📰 Mundo Beyblade</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {noticias.map(n => (
                <div key={n.titulo} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{n.emoji}</span>
                    <div>
                      <p style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 3, lineHeight: 1.4 }}>{n.titulo}</p>
                      <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{n.desc}</p>
                      <p style={{ fontFamily: 'DM Sans', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>{n.data}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  const { user, perfil, loading } = useAuth()
  const [torneios, setTorneios] = useState<Torneio[]>([])
  const [topBladers, setTopBladers] = useState<EstatisticasBlade[]>([])
  const [showPitch, setShowPitch] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('torneios').select('id, nome, status, data_inicio, formato').in('status', ['em_andamento', 'inscricoes', 'finalizado']).order('data_inicio', { ascending: false }).limit(10),
      supabase.from('estatisticas_blades').select('*').order('total_vitorias', { ascending: false }).limit(5),
    ]).then(([{ data: t }, { data: b }]) => {
      if (t) setTorneios(t as Torneio[])
      if (b) setTopBladers(b as EstatisticasBlade[])
    })
  }, [user])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</div>
    </>
  )

  if (!user) return (
    <>
      <Navbar />
      <HomePublica onShowPitch={() => setShowPitch(true)} />
      {showPitch && <AppPresentacaoModal onClose={() => setShowPitch(false)} />}
    </>
  )

  const nomeDisplay = perfil?.nome_display ?? perfil?.username ?? 'Blader'

  return (
    <>
      <Navbar />
      <HomeDashboard nomeDisplay={nomeDisplay} torneios={torneios} topBladers={topBladers} onShowPitch={() => setShowPitch(true)} />
      {showPitch && <AppPresentacaoModal onClose={() => setShowPitch(false)} />}
    </>
  )
}
