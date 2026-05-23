import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Torneio } from '@/types'
import { CardTorneio } from './CardTorneio'
import { formatFormato, getStatusColor } from '@/lib/utils'
import { Search } from 'lucide-react'

const STATUS_DOT: Record<string, string> = {
  em_andamento: 'var(--color-blue-light)',
  inscricoes:   'var(--color-success)',
  rascunho:     'var(--color-warning)',
  finalizado:   'var(--color-text-muted)',
  cancelado:    'var(--color-danger)',
}

const STATUS_LABEL: Record<string, string> = {
  em_andamento: 'Em andamento',
  inscricoes:   'Inscrições',
  rascunho:     'Rascunho',
  finalizado:   'Finalizado',
  cancelado:    'Cancelado',
}

function refDate(t: Torneio): Date {
  return new Date(t.data_inicio ?? t.created_at)
}

function monthLabel(t: Torneio): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(refDate(t))
    .replace(/^\w/, c => c.toUpperCase())
}

function groupByMonth(list: Torneio[], asc: boolean): [string, Torneio[]][] {
  const map = new Map<string, Torneio[]>()
  for (const t of list) {
    const k = monthLabel(t)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(t)
  }
  return [...map.entries()].sort(([, a], [, b]) => {
    const ta = refDate(a[0]).getTime()
    const tb = refDate(b[0]).getTime()
    return asc ? ta - tb : tb - ta
  })
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', paddingBottom: 10, borderBottom: '2px solid var(--color-blue-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
      {children}
    </h2>
  )
}

function MonthLabel({ label }: { label: string }) {
  return <div style={{ fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12, marginTop: 4 }}>{label}</div>
}

function TorneioGrid({ list }: { list: Torneio[] }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>{list.map(t => <CardTorneio key={t.id} torneio={t} />)}</div>
}

function EmptySection({ label }: { label: string }) {
  return <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 13 }}>{label}</div>
}

function LiveDot() {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--color-blue-light)', opacity: 0.5, animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite' }} />
      <span style={{ position: 'relative', width: 10, height: 10, borderRadius: '50%', background: 'var(--color-blue-light)', display: 'inline-block' }} />
      <style>{`@keyframes ping { 0%{transform:scale(1);opacity:.7} 75%,100%{transform:scale(2);opacity:0} }`}</style>
    </span>
  )
}

interface Props { torneios: Torneio[]; isAdmin: boolean }

export function TorneiosLayout({ torneios, isAdmin }: Props) {
  const [query, setQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return torneios
    return torneios.filter(t => t.nome.toLowerCase().includes(q) || t.descricao?.toLowerCase().includes(q) || formatFormato(t.formato).toLowerCase().includes(q))
  }, [torneios, query])

  const ativos     = filtered.filter(t => t.status === 'em_andamento')
  const proximos   = filtered.filter(t => t.status === 'inscricoes' || t.status === 'rascunho')
  const concluidos = filtered.filter(t => t.status === 'finalizado' || t.status === 'cancelado')
  const proximosGrupos   = groupByMonth(proximos, true)
  const concluidosGrupos = groupByMonth(concluidos, false)

  if (isMobile) return <TorneiosMobile torneios={torneios} isAdmin={isAdmin} filtered={filtered} ativos={ativos} proximos={proximos} concluidos={concluidos} proximosGrupos={proximosGrupos} concluidosGrupos={concluidosGrupos} query={query} setQuery={setQuery} />

  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', maxWidth: 1300, margin: '0 auto', padding: '0 24px 48px' }}>
      <aside style={{ width: 264, flexShrink: 0, position: 'sticky', top: 60, height: 'calc(100vh - 76px)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', paddingRight: 20, paddingTop: 32, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'Rajdhani', fontSize: 22, fontWeight: 700, margin: 0 }}>Torneios</h1>
          {isAdmin && <Link to="/torneios/criar" style={{ fontSize: 11, fontFamily: 'DM Sans', fontWeight: 600, background: 'var(--color-blue-primary)', color: '#fff', padding: '5px 10px', borderRadius: 6, whiteSpace: 'nowrap', textDecoration: 'none' }}>+ Criar</Link>}
        </div>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Buscar torneio..." value={query} onChange={e => setQuery(e.target.value)} style={{ width: '100%', padding: '8px 10px 8px 30px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 13, outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {ativos.length > 0 && <span style={{ fontSize: 11, fontFamily: 'DM Sans', padding: '2px 8px', borderRadius: 10, background: 'rgba(74,122,255,0.15)', color: 'var(--color-blue-light)' }}>{ativos.length} ao vivo</span>}
          {proximos.length > 0 && <span style={{ fontSize: 11, fontFamily: 'DM Sans', padding: '2px 8px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)' }}>{proximos.length} próximos</span>}
          {concluidos.length > 0 && <span style={{ fontSize: 11, fontFamily: 'DM Sans', padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>{concluidos.length} finalizados</span>}
        </div>
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 13, textAlign: 'center', paddingTop: 24 }}>Nenhum torneio encontrado.</div>
          ) : filtered.map(t => (
            <Link key={t.id} to={`/torneios/${t.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-card)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: STATUS_DOT[t.status] ?? 'var(--color-text-muted)' }} />
              <span style={{ fontFamily: 'DM Sans', fontSize: 12, flex: 1, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nome}</span>
              <span style={{ fontSize: 10, fontFamily: 'DM Sans', fontWeight: 600, color: STATUS_DOT[t.status] ?? 'var(--color-text-muted)', background: `${STATUS_DOT[t.status] ?? '#fff'}18`, padding: '1px 6px', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>{STATUS_LABEL[t.status] ?? t.status}</span>
            </Link>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, paddingLeft: 32, paddingTop: 32, minWidth: 0 }}>
        {filtered.length === 0 && query && <div className="card" style={{ textAlign: 'center', padding: 48 }}><div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div><p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Nenhum torneio encontrado para <strong>"{query}"</strong></p></div>}
        {ativos.length > 0 && <section style={{ marginBottom: 40 }}><SectionHeader><LiveDot />Em andamento</SectionHeader><TorneioGrid list={ativos} /></section>}
        {(proximos.length > 0 || (!query && torneios.some(t => t.status === 'inscricoes' || t.status === 'rascunho'))) && (
          <section style={{ marginBottom: 40 }}>
            <SectionHeader>📅 Próximos Torneios</SectionHeader>
            {proximos.length === 0 ? <EmptySection label="Nenhum torneio próximo." /> : proximosGrupos.map(([month, list]) => <div key={month}><MonthLabel label={month} /><TorneioGrid list={list} /></div>)}
          </section>
        )}
        {(concluidos.length > 0 || torneios.some(t => t.status === 'finalizado' || t.status === 'cancelado')) && (
          <section style={{ marginBottom: 40 }}>
            <SectionHeader>🏆 Histórico</SectionHeader>
            {concluidos.length === 0 ? <EmptySection label="Nenhum torneio finalizado ainda." /> : concluidosGrupos.map(([month, list]) => <div key={month}><MonthLabel label={month} /><TorneioGrid list={list} /></div>)}
          </section>
        )}
        {torneios.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
            <h3 style={{ fontFamily: 'Rajdhani', fontSize: 20, marginBottom: 8 }}>Nenhum torneio ainda</h3>
            <p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 14 }}>Os torneios criados aparecerão aqui.</p>
            {isAdmin && <Link to="/torneios/criar" className="btn-primary" style={{ display: 'inline-block', marginTop: 20, textDecoration: 'none' }}>Criar primeiro torneio</Link>}
          </div>
        )}
      </main>
    </div>
  )
}

interface MobileProps {
  torneios: Torneio[]; isAdmin: boolean; filtered: Torneio[]; ativos: Torneio[]; proximos: Torneio[]; concluidos: Torneio[]
  proximosGrupos: [string, Torneio[]][]; concluidosGrupos: [string, Torneio[]][]; query: string; setQuery: (q: string) => void
}

function TorneiosMobile({ torneios, isAdmin, filtered, ativos, proximos, concluidos, proximosGrupos, concluidosGrupos, query, setQuery }: MobileProps) {
  return (
    <div style={{ padding: '16px 16px 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: 26, fontWeight: 700, margin: 0 }}>Torneios</h1>
        {isAdmin && <Link to="/torneios/criar" style={{ fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600, background: 'var(--color-blue-primary)', color: '#fff', padding: '6px 12px', borderRadius: 8, textDecoration: 'none' }}>+ Criar</Link>}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {ativos.length > 0 && <span style={{ fontSize: 11, fontFamily: 'DM Sans', padding: '3px 10px', borderRadius: 10, background: 'rgba(74,122,255,0.15)', color: 'var(--color-blue-light)' }}>{ativos.length} ao vivo</span>}
        {proximos.length > 0 && <span style={{ fontSize: 11, fontFamily: 'DM Sans', padding: '3px 10px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)' }}>{proximos.length} próximos</span>}
        {concluidos.length > 0 && <span style={{ fontSize: 11, fontFamily: 'DM Sans', padding: '3px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>{concluidos.length} finalizados</span>}
      </div>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
        <input type="text" placeholder="Buscar torneio..." value={query} onChange={e => setQuery(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 30px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, color: 'var(--color-text-primary)', fontFamily: 'DM Sans', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>
      {ativos.length > 0 && <section style={{ marginBottom: 32 }}><SectionHeader><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-blue-light)', display: 'inline-block' }} /> Em andamento</SectionHeader><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{ativos.map(t => <CardTorneio key={t.id} torneio={t} />)}</div></section>}
      {proximos.length > 0 && <section style={{ marginBottom: 32 }}><SectionHeader>📅 Próximos</SectionHeader>{proximosGrupos.map(([month, list]) => <div key={month}><MonthLabel label={month} /><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{list.map(t => <CardTorneio key={t.id} torneio={t} />)}</div></div>)}</section>}
      {concluidos.length > 0 && <section style={{ marginBottom: 32 }}><SectionHeader>🏆 Histórico</SectionHeader>{concluidosGrupos.map(([month, list]) => <div key={month}><MonthLabel label={month} /><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{list.map(t => <CardTorneio key={t.id} torneio={t} />)}</div></div>)}</section>}
      {torneios.length === 0 && <div className="card" style={{ textAlign: 'center', padding: 48 }}><div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div><h3 style={{ fontFamily: 'Rajdhani', fontSize: 18, marginBottom: 6 }}>Nenhum torneio ainda</h3><p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: 13 }}>Os torneios criados aparecerão aqui.</p>{isAdmin && <Link to="/torneios/criar" className="btn-primary" style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}>Criar torneio</Link>}</div>}
    </div>
  )
}
