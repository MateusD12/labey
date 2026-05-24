import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

const FEATURES = [
  {
    icon: '🏆',
    title: '6 Formatos de Torneio',
    desc: 'Eliminatório Simples e Duplo, Sistema Suíço, Fase de Grupos, Round Robin e Copa do Mundo — cada modalidade com regras e progressão próprias.',
    color: '#FFD700',
  },
  {
    icon: '⚡',
    title: 'Brackets ao Vivo',
    desc: 'Chaveamento visual atualizado em tempo real via WebSocket. Todos os participantes acompanham o torneio de onde estiverem.',
    color: '#2b5be8',
  },
  {
    icon: '📊',
    title: 'Rankings Dinâmicos',
    desc: 'Sistema de pontuação configurável por torneio. Posições, win rate, vitórias e derrotas calculados automaticamente.',
    color: '#22c55e',
  },
  {
    icon: '🧑‍⚖️',
    title: 'Sistema de Juízes',
    desc: 'Admin designa árbitros para cada partida com distribuição round-robin automática. Juízes e jogadores recebem push quando a partida começa.',
    color: '#a78bfa',
  },
  {
    icon: '🔔',
    title: 'Push Notifications',
    desc: 'Notificações nativas no celular mesmo com o app fechado. Juízes e os dois jogadores da próxima partida são avisados automaticamente.',
    color: '#f59e0b',
  },
  {
    icon: '✅',
    title: 'Check-in de Participantes',
    desc: 'Participantes confirmam presença pelo celular. O organizador vê em tempo real quem chegou antes de iniciar o torneio.',
    color: '#22c55e',
  },
  {
    icon: '⏱️',
    title: 'Timer de Partida',
    desc: 'Cronômetro regressivo flutuante para controlar o tempo de cada battle. Presets de 1, 2, 3 e 5 minutos com alerta visual ao fim.',
    color: '#ef4444',
  },
  {
    icon: '📱',
    title: 'PWA — App Nativo',
    desc: 'Instalável diretamente pelo celular sem precisar de App Store. Funciona offline, tela cheia e com ícone na home screen.',
    color: '#06b6d4',
  },
  {
    icon: '👤',
    title: 'Perfis & Conquistas',
    desc: 'Perfil com avatar, stats completos e sistema de badges — Campeão, Veterano, Em Chamas, Imparável e mais.',
    color: '#ec4899',
  },
  {
    icon: '🎲',
    title: 'Gerador de Combos',
    desc: 'Sorteia dois combos competitivos sem peças repetidas. Suporta BX/UX, CX e CX Expend. Filtro por geração e histórico dos últimos sorteios.',
    color: '#8b5cf6',
  },
  {
    icon: '🗂️',
    title: 'Coleção & Arsenal',
    desc: 'Cadastre suas peças com foto, visualize por Beyblade e monte decks com W/L tracker. Tudo salvo na nuvem.',
    color: '#f59e0b',
  },
  {
    icon: '🌐',
    title: 'Comunidade',
    desc: 'Feed da comunidade para compartilhar posts, resultados e novidades do mundo Beyblade diretamente na plataforma.',
    color: '#10b981',
  },
  {
    icon: '📺',
    title: 'Modo TV Avançado',
    desc: 'Tela fullscreen para telão com atualização automática a cada 10s. Copa do Mundo tem abas Grupos/Eliminatória com troca automática quando a fase muda. Top 10 ao vivo com pontuação durante fase de grupos. Resultados recentes exibidos no topo.',
    color: '#22c55e',
  },
  {
    icon: '🌍',
    title: 'Copa do Mundo Completa',
    desc: 'Máximo 4 jogadores por grupo. Rodadas configuráveis (1–4) com chaveamento circular automático. Top 2 de cada grupo avança para a eliminatória assim que o grupo termina, com cross-seeding automático. Abas inteligentes na tela do torneio.',
    color: '#f59e0b',
  },
  {
    icon: '🎲',
    title: 'Simulação de Testes',
    desc: 'Admin pode simular uma rodada, o torneio inteiro ou ativar auto-simulação por formato. Copa do Mundo avança top 2 de cada grupo automaticamente; Suíço gera cada rodada automaticamente. Ao terminar, finaliza o torneio e anuncia o campeão.',
    color: '#a78bfa',
  },
  {
    icon: '↩️',
    title: 'Desfazer Resultado',
    desc: 'Admin pode anular qualquer resultado com um clique. O vencedor é removido do próximo slot do bracket automaticamente, sem inconsistências.',
    color: '#ef4444',
  },
  {
    icon: '⏳',
    title: 'Fila de Espera',
    desc: 'Torneio lotado? Participantes entram automaticamente na fila por ordem de chegada. O organizador promove com um clique quando uma vaga abre.',
    color: '#f59e0b',
  },
  {
    icon: '⚔️',
    title: 'Confronto Direto H2H',
    desc: 'No perfil de outro blader, veja o histórico completo de batalhas entre vocês — placar agregado, vitórias, derrotas e detalhes de cada confronto.',
    color: '#a78bfa',
  },
  {
    icon: '📋',
    title: 'Templates de Torneio',
    desc: 'Salve qualquer configuração de torneio como template e reutilize com um clique. Ideal para organizadores que realizam eventos regulares.',
    color: '#06b6d4',
  },
]

const ADMIN_FEATURES = [
  { icon: '✅', text: 'Aprovação de inscrições com um clique' },
  { icon: '🔢', text: 'Seeds automáticos baseados no ranking' },
  { icon: '🎯', text: 'Atribuição de juízes round-robin automática' },
  { icon: '🔄', text: 'Geração automática de todas as rodadas' },
  { icon: '📋', text: 'Check-in com visão de presença em tempo real' },
  { icon: '📊', text: 'Classificação de grupos pública para todos' },
  { icon: '📲', text: 'QR Code de inscrição + botão Compartilhar' },
  { icon: '⏱️', text: 'Timer de partida flutuante configurável' },
  { icon: '🏅', text: 'Vinculação a múltiplos rankings' },
  { icon: '⚙️', text: 'Configuração de pontuação, grupos e rodadas' },
  { icon: 'W.O.', text: 'Registro de W.O. com avanço no bracket' },
  { icon: '📡', text: 'Realtime — bracket sincronizado em todos os devices' },
  { icon: '📺', text: 'Modo TV fullscreen — grupos em grid multi-coluna, atualização 10s' },
  { icon: '🎲', text: 'Auto-simulação com avanço automático grupos → eliminatória (Copa do Mundo)' },
  { icon: '🔧', text: 'Reparar bracket — reaplica avanços de vencedores com um clique' },
  { icon: '↩️', text: 'Desfazer resultado com correção automática do bracket' },
  { icon: '⏳', text: 'Fila de espera com promoção manual por ordem de chegada' },
  { icon: '📋', text: 'Templates de torneio reutilizáveis com um clique' },
  { icon: '🛟', text: 'Detecção de torneio sem partidas: alerta + reset automático para inscrições' },
]

export function AppPresentacaoModal({ onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', handleKey) }
  }, [onClose])

  return (
    <>
      <style>{`
        @keyframes labey-fadein { from { opacity: 0 } to { opacity: 1 } }
        @keyframes labey-slideup { from { opacity: 0; transform: translateY(32px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes labey-pulse-dot { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.5; transform: scale(0.85) } }
        .labey-feat-card { transition: transform 0.18s, border-color 0.18s; }
        .labey-feat-card:hover { transform: translateY(-4px); }
        .labey-feat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
        .labey-admin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .labey-roadmap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
        @media(max-width:520px){
          .labey-feat-grid { grid-template-columns: 1fr !important; }
          .labey-admin-grid { grid-template-columns: 1fr !important; }
          .labey-roadmap-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)', zIndex: 2000,
          animation: 'labey-fadein 0.2s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 2001,
          overflowY: 'auto', padding: '24px 16px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 860,
            background: 'linear-gradient(160deg, #0d0d1a 0%, #111128 100%)',
            border: '1px solid rgba(43,91,232,0.3)',
            borderRadius: 20,
            boxShadow: '0 0 80px rgba(43,91,232,0.25), 0 32px 64px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            animation: 'labey-slideup 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)', zIndex: 1, transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          >
            <X size={16} />
          </button>

          {/* ── HERO ── */}
          <div style={{
            padding: '56px 40px 44px',
            background: 'linear-gradient(135deg, rgba(43,91,232,0.18) 0%, rgba(43,91,232,0.04) 60%)',
            borderBottom: '1px solid rgba(43,91,232,0.15)',
            textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Background glow orbs */}
            <div style={{ position: 'absolute', top: -60, left: '20%', width: 280, height: 280, background: 'radial-gradient(circle, rgba(43,91,232,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -80, right: '15%', width: 220, height: 220, background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <img src="/logo.png" alt="LaBey" style={{ height: 52, objectFit: 'contain', display: 'block', margin: '0 auto 20px', filter: 'drop-shadow(0 0 16px rgba(43,91,232,0.6))' }} />

            <h1 style={{
              fontFamily: 'Rajdhani', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700,
              lineHeight: 1.1, marginBottom: 16,
              background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #2b5be8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              A plataforma de Beyblade<br />mais completa do Brasil
            </h1>

            <p style={{ fontFamily: 'DM Sans', fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.7 }}>
              LaBey digitaliza completamente a experiência de torneios de Beyblade — da inscrição ao pódio — com tecnologia em tempo real, notificações push e gestão profissional de competições.
            </p>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: '6 formatos', sub: 'de torneio' },
                { label: 'Modo TV', sub: 'bracket em telão' },
                { label: 'Check-in', sub: 'presença digital' },
                { label: 'Fila de espera', sub: 'vagas inteligentes' },
                { label: 'H2H', sub: 'confronto direto' },
                { label: 'Push alerts', sub: 'jogador + juiz' },
                { label: 'Combos & Decks', sub: 'gestão de peças' },
                { label: 'PWA nativo', sub: 'sem App Store' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(43,91,232,0.12)', border: '1px solid rgba(43,91,232,0.3)',
                  borderRadius: 40, padding: '7px 18px', textAlign: 'center',
                }}>
                  <span style={{ fontFamily: 'Rajdhani', fontSize: 14, fontWeight: 700, color: '#93c5fd', display: 'block' }}>{s.label}</span>
                  <span style={{ fontFamily: 'DM Sans', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{s.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── FEATURES GRID ── */}
          <div style={{ padding: '40px 32px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg, #2b5be8, #93c5fd)', borderRadius: 2 }} />
              <h2 style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>Funcionalidades</h2>
            </div>

            <div className="labey-feat-grid">
              {FEATURES.map(f => (
                <div
                  key={f.title}
                  className="labey-feat-card"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${f.color}22`,
                    borderRadius: 12,
                    padding: '18px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{f.icon}</span>
                    <h3 style={{ fontFamily: 'Rajdhani', fontSize: 15, fontWeight: 700, color: f.color }}>{f.title}</h3>
                  </div>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── ADMIN SECTION ── */}
          <div style={{ padding: '36px 32px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg, #a78bfa, #6366f1)', borderRadius: 2 }} />
              <h2 style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>Painel do Organizador</h2>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(43,91,232,0.05) 100%)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '24px' }}>
              <div className="labey-admin-grid">
              {ADMIN_FEATURES.map(a => (
                <div key={a.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontFamily: a.icon === 'W.O.' ? 'Rajdhani' : 'inherit', fontSize: a.icon === 'W.O.' ? 11 : 16, color: '#a78bfa', flexShrink: 0, marginTop: 1, fontWeight: 700 }}>{a.icon}</span>
                  <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{a.text}</span>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* ── TECH STACK ── */}
          <div style={{ padding: '32px 32px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg, #06b6d4, #22c55e)', borderRadius: 2 }} />
              <h2 style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>Stack Tecnológica</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { name: 'React 19', color: '#61dafb' },
                { name: 'TypeScript', color: '#3178c6' },
                { name: 'Vite 6', color: '#646cff' },
                { name: 'Supabase', color: '#3ecf8e' },
                { name: 'PostgreSQL', color: '#336791' },
                { name: 'Realtime WebSocket', color: '#2b5be8' },
                { name: 'Web Push / VAPID', color: '#f59e0b' },
                { name: 'PWA / Workbox', color: '#ec4899' },
                { name: 'Vercel', color: '#fff' },
              ].map(t => (
                <span key={t.name} style={{
                  fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600,
                  color: t.color, background: `${t.color}15`,
                  border: `1px solid ${t.color}30`,
                  borderRadius: 20, padding: '4px 12px',
                }}>
                  {t.name}
                </span>
              ))}
            </div>
          </div>

          {/* ── ROADMAP ── */}
          <div style={{ padding: '32px 32px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg, #FFD700, #f59e0b)', borderRadius: 2 }} />
              <h2 style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>Próximos Passos</h2>
            </div>
            <div className="labey-roadmap-grid">
              {[
                { icon: '📹', text: 'Transmissão ao vivo integrada', status: 'planned' },
                { icon: '🤝', text: 'Patrocinadores e premiações digitais', status: 'planned' },
                { icon: '🌎', text: 'Torneios internacionais online', status: 'planned' },
                { icon: '🎒', text: 'Deck de batalha: 3 Beyblades selecionados para o torneio', status: 'planned' },
                { icon: '📱', text: 'App nativo iOS / Android', status: 'planned' },
                { icon: '🏪', text: 'Marketplace de peças Beyblade', status: 'planned' },
              ].map(r => (
                <div key={r.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)', borderRadius: 10, padding: '10px 12px' }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                  <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{r.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── FOOTER CTA ── */}
          <div style={{
            margin: '32px 32px 0',
            marginBottom: 32,
            background: 'linear-gradient(135deg, rgba(43,91,232,0.2) 0%, rgba(99,102,241,0.1) 100%)',
            border: '1px solid rgba(43,91,232,0.25)',
            borderRadius: 14,
            padding: '28px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <p style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Pronto para o próximo nível?</p>
              <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                LaBey está em desenvolvimento ativo.<br />Toda batalha conta para o ranking.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="/torneios" onClick={onClose} style={{
                padding: '11px 24px', borderRadius: 10, background: 'var(--color-blue-primary)',
                color: '#fff', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14,
                textDecoration: 'none', display: 'inline-block',
                boxShadow: '0 0 20px rgba(43,91,232,0.4)',
              }}>
                Ver Torneios
              </a>
              <button onClick={onClose} style={{
                padding: '11px 24px', borderRadius: 10, background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)',
                fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, cursor: 'pointer',
              }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
