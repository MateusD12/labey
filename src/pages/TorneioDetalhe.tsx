import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Share2, QrCode, CheckCircle2, Timer, Tv } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { useTorneio } from '@/hooks/useTorneio'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { BracketEliminatorio } from '@/components/torneio/BracketEliminatorio'
import { BracketSuico } from '@/components/torneio/BracketSuico'
import { FaseDeGrupos } from '@/components/torneio/FaseDeGrupos'
import { RoundRobin } from '@/components/torneio/RoundRobin'
import { Posicoes } from '@/components/torneio/Posicoes'
import { GruposStandings } from '@/components/torneio/GruposStandings'
import { PartidaTimer } from '@/components/torneio/PartidaTimer'
import { formatDate, formatFormato, formatStatus } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  rascunho:    'rgba(90,90,122,0.3)',
  inscricoes:  'rgba(245,158,11,0.2)',
  em_andamento:'rgba(43,91,232,0.2)',
  finalizado:  'rgba(34,197,94,0.15)',
  cancelado:   'rgba(239,68,68,0.15)',
}
const STATUS_TEXT: Record<string, string> = {
  rascunho:    'var(--color-text-muted)',
  inscricoes:  'var(--color-warning)',
  em_andamento:'var(--color-blue-light)',
  finalizado:  'var(--color-success)',
  cancelado:   'var(--color-danger)',
}

type Tab = 'partidas' | 'posicoes' | 'grupos'

export default function TorneioDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { torneio, partidas, inscricoes, rankings, loading, reload } = useTorneio(id!)
  const { user, perfil } = useAuth()
  const isAdmin = perfil?.is_admin ?? false

  const [activeTab, setActiveTab] = useState<Tab>('partidas')
  const [showQR, setShowQR] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)

  const hasGrupos = torneio?.formato === 'fase_grupos' || torneio?.formato === 'copa_do_mundo'

  // Find current user's inscricao
  const minhaInscricao = user
    ? inscricoes.find(i => i.blade_id === user.id && i.status === 'aprovado')
    : undefined

  // Init checkedIn state from inscricao on mount
  const alreadyCheckedIn = minhaInscricao?.checked_in ?? false

  async function handleCheckIn() {
    if (!minhaInscricao || checkingIn || alreadyCheckedIn || checkedIn) return
    setCheckingIn(true)
    await supabase.from('inscricoes').update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
    }).eq('id', minhaInscricao.id)
    setCheckedIn(true)
    setCheckingIn(false)
    reload()
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: torneio?.nome ?? 'Torneio LaBey', url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copiado!')
    }
  }

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
        Carregando torneio...
      </div>
    </>
  )

  if (!torneio) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: 60 }}>
        <h2 style={{ fontFamily: 'Rajdhani', fontSize: '24px' }}>Torneio não encontrado</h2>
      </div>
    </>
  )

  const renderBracket = () => {
    switch (torneio.formato) {
      case 'eliminatorio_simples':
      case 'eliminatorio_duplo':
        return <BracketEliminatorio partidas={partidas} isAdmin={isAdmin} onRefresh={reload} />
      case 'copa_do_mundo': {
        const temElim = partidas.some(p => p.fase !== 'grupos')
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <FaseDeGrupos partidas={partidas.filter(p => p.fase === 'grupos')} isAdmin={isAdmin} onRefresh={reload} pontos={{ vitoria: torneio.pontos_vitoria, empate: torneio.pontos_empate, derrota: torneio.pontos_derrota }} />
            {temElim && (
              <div>
                <h3 style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Fase Eliminatória</h3>
                <BracketEliminatorio partidas={partidas.filter(p => p.fase !== 'grupos')} isAdmin={isAdmin} onRefresh={reload} />
              </div>
            )}
          </div>
        )
      }
      case 'suico':
        return <BracketSuico partidas={partidas} isAdmin={isAdmin} onRefresh={reload} />
      case 'fase_grupos':
        return <FaseDeGrupos partidas={partidas} isAdmin={isAdmin} onRefresh={reload} pontos={{ vitoria: torneio.pontos_vitoria, empate: torneio.pontos_empate, derrota: torneio.pontos_derrota }} />
      case 'round_robin':
        return <RoundRobin partidas={partidas} isAdmin={isAdmin} onRefresh={reload} />
    }
  }

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '8px 20px', fontFamily: 'DM Sans', fontSize: 14, fontWeight: 500,
    border: 'none', cursor: 'pointer',
    borderBottom: activeTab === t ? '2px solid var(--color-blue-primary)' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === t ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  })

  const isChecked = alreadyCheckedIn || checkedIn

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontFamily: 'Rajdhani', fontSize: 36, fontWeight: 700, marginBottom: 10 }}>{torneio.nome}</h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Sans', fontSize: 12, background: 'rgba(43,91,232,0.12)', color: 'var(--color-blue-light)', padding: '3px 10px', borderRadius: 20 }}>
                  {formatFormato(torneio.formato)}
                </span>
                <span style={{ fontFamily: 'DM Sans', fontSize: 12, background: STATUS_COLORS[torneio.status] ?? 'transparent', color: STATUS_TEXT[torneio.status] ?? 'var(--color-text-muted)', padding: '3px 10px', borderRadius: 20 }}>
                  {formatStatus(torneio.status)}
                </span>
                {torneio.data_inicio && (
                  <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(torneio.data_inicio)}</span>
                )}
              </div>
              {rankings.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--color-text-muted)', marginRight: 2 }}>Conta para:</span>
                  {rankings.map(r => (
                    <span key={r.id} style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, background: 'rgba(43,91,232,0.15)', color: 'var(--color-blue-light)', border: '1px solid rgba(43,91,232,0.3)', padding: '2px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      🏅 {r.nome}{r.temporada ? ` · ${r.temporada}` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Modo TV */}
              <Link to={`/torneios/${id}/tv`} title="Modo TV" target="_blank" rel="noopener noreferrer" style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <Tv size={16} />
              </Link>

              {/* Share */}
              <button onClick={handleShare} title="Compartilhar" style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Sans', fontSize: 13 }}>
                <Share2 size={14} /> Compartilhar
              </button>

              {/* QR */}
              <button onClick={() => setShowQR(true)} title="QR Code" style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <QrCode size={16} />
              </button>

              {/* Timer (admin only) */}
              {isAdmin && (
                <button onClick={() => setShowTimer(v => !v)} title="Timer de partida" style={{ background: showTimer ? 'rgba(43,91,232,0.15)' : 'none', border: '1px solid var(--color-border)', color: showTimer ? 'var(--color-blue-light)' : 'var(--color-text-secondary)', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Timer size={16} />
                </button>
              )}

              {/* Check-in */}
              {minhaInscricao && (torneio.status === 'inscricoes' || torneio.status === 'em_andamento') && (
                <button onClick={handleCheckIn} disabled={isChecked || checkingIn} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: isChecked ? '#22c55e22' : 'var(--color-blue-primary)',
                  border: isChecked ? '1px solid #22c55e44' : 'none',
                  color: isChecked ? '#22c55e' : '#fff',
                  padding: '8px 16px', borderRadius: 8, cursor: isChecked ? 'default' : 'pointer',
                  fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13,
                }}>
                  <CheckCircle2 size={14} />
                  {isChecked ? 'Check-in feito!' : checkingIn ? 'Confirmando...' : 'Fazer Check-in'}
                </button>
              )}

              {torneio.status === 'inscricoes' && (
                <Link to={`/torneios/${id}/inscricao`} className="btn-primary" style={{ textDecoration: 'none' }}>
                  Inscrever-se
                </Link>
              )}
              {isAdmin && (
                <Link to={`/torneios/${id}/admin`} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: 13, textDecoration: 'none' }}>
                  Gerenciar
                </Link>
              )}
            </div>
          </div>

          {torneio.descricao && (
            <p style={{ marginTop: 14, color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: 14, lineHeight: 1.6, maxWidth: 720 }}>
              {torneio.descricao}
            </p>
          )}

          <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)' }}>
              👥 <strong style={{ color: 'var(--color-text-primary)' }}>{inscricoes.length}</strong> participantes
              {inscricoes.filter(i => i.checked_in).length > 0 && (
                <span style={{ color: '#22c55e', marginLeft: 4 }}>
                  ({inscricoes.filter(i => i.checked_in).length} com check-in)
                </span>
              )}
            </span>
            {torneio.premio && (
              <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)' }}>
                🏆 <strong style={{ color: 'var(--color-warning)' }}>{torneio.premio}</strong>
              </span>
            )}
            {partidas.length > 0 && (
              <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--color-text-muted)' }}>
                ⚔️ <strong style={{ color: 'var(--color-text-primary)' }}>{partidas.filter(p => p.status === 'finalizada').length}/{partidas.length}</strong> partidas
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)', marginBottom: 28, overflowX: 'auto' }}>
          <button style={tabStyle('partidas')} onClick={() => setActiveTab('partidas')}>Partidas</button>
          <button style={tabStyle('posicoes')} onClick={() => setActiveTab('posicoes')}>Posições</button>
          {hasGrupos && (
            <button style={tabStyle('grupos')} onClick={() => setActiveTab('grupos')}>Grupos</button>
          )}
        </div>

        {activeTab === 'partidas' && (
          partidas.length > 0 ? renderBracket() : (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>
              {torneio.status === 'inscricoes' ? '⏳ Aguardando encerramento das inscrições para gerar partidas.' : 'As partidas ainda não foram geradas.'}
            </div>
          )
        )}

        {activeTab === 'posicoes' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontFamily: 'Rajdhani', fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>Classificação Geral</h3>
            </div>
            <Posicoes inscricoes={inscricoes} partidas={partidas} />
          </div>
        )}

        {activeTab === 'grupos' && hasGrupos && (
          <GruposStandings
            partidas={partidas.filter(p => p.fase === 'grupos')}
            inscricoes={inscricoes}
            pontos={{ vitoria: torneio.pontos_vitoria, empate: torneio.pontos_empate, derrota: torneio.pontos_derrota }}
          />
        )}
      </main>

      {/* QR Modal */}
      {showQR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={() => setShowQR(false)}>
          <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 16, padding: 32, textAlign: 'center', border: '1px solid var(--color-border)', maxWidth: 300 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: 'var(--color-text-primary)', marginBottom: 16 }}>
              QR de Inscrição
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=ffffff&bgcolor=1a1a2e&data=${encodeURIComponent(window.location.href)}`}
              alt="QR Code"
              style={{ borderRadius: 8, border: '2px solid var(--color-border)' }}
            />
            <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
              Aponte a câmera para acessar o torneio
            </div>
            <button onClick={() => setShowQR(false)} style={{ marginTop: 16, background: 'var(--color-blue-primary)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600 }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Floating Timer */}
      {showTimer && <PartidaTimer onClose={() => setShowTimer(false)} />}
    </>
  )
}
