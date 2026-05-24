import { useState } from 'react'
import type { Partida } from '@/types'
import { MatchCard } from './MatchCard'
import { ResultadoModal } from './ResultadoModal'
import { calcularClassificacaoGrupo } from '@/lib/algorithms/grupos'

interface Props {
  partidas: Partida[]
  isAdmin?: boolean
  onRefresh?: () => void
  pontos?: { vitoria: number; empate: number; derrota: number }
  tvMode?: boolean
}

export function FaseDeGrupos({ partidas, isAdmin, onRefresh, pontos = { vitoria: 3, empate: 1, derrota: 0 }, tvMode }: Props) {
  const [modalPartida, setModalPartida] = useState<Partida | null>(null)
  const [activeTab, setActiveTab] = useState<Record<string, 'partidas' | 'posicoes'>>({})

  const grupos = [...new Set(partidas.map(p => p.grupo).filter(Boolean) as string[])].sort()
  const classificacao = calcularClassificacaoGrupo(partidas, pontos)

  const tabOf = (g: string) => activeTab[g] ?? (tvMode ? 'posicoes' : 'partidas')
  const setTab = (g: string, t: 'partidas' | 'posicoes') => setActiveTab(prev => ({ ...prev, [g]: t }))

  return (
    <div style={tvMode
      ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }
      : { display: 'flex', flexDirection: 'column', gap: 32 }
    }>
      {grupos.map(grupo => {
        const grupoPartidas = partidas.filter(p => p.grupo === grupo)
        const rodadas = [...new Set(grupoPartidas.map(p => p.numero_rodada).filter(Boolean) as number[])].sort((a, b) => a - b)
        const classGrupo = [...classificacao.values()].filter(c => c.grupo === grupo).sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.vitorias - a.vitorias)
        const tab = tabOf(grupo)

        return (
          <div key={grupo} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-border)', background: 'rgba(43,91,232,0.06)' }}>
              <h3 style={{ fontFamily: 'Rajdhani', fontSize: 18, fontWeight: 700, color: 'var(--color-blue-light)', margin: 0 }}>Grupo {grupo}</h3>
              <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                {(['partidas', 'posicoes'] as const).map(t => (
                  <button key={t} onClick={() => setTab(grupo, t)} style={{ padding: '6px 16px', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: tab === t ? 'var(--color-blue-primary)' : 'transparent', color: tab === t ? '#fff' : 'var(--color-text-secondary)', transition: 'all 0.15s' }}>
                    {t === 'partidas' ? 'Partidas' : 'Posições'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: 20 }}>
              {tab === 'partidas' && (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'flex', gap: 16, minWidth: 'max-content' }}>
                    {(rodadas.length > 0 ? rodadas : [null]).map(rodada => {
                      const rodadaPartidas = rodada != null ? grupoPartidas.filter(p => p.numero_rodada === rodada) : grupoPartidas
                      return (
                        <div key={rodada ?? 'all'} style={{ minWidth: 220 }}>
                          <div style={{ fontFamily: 'Rajdhani', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', marginBottom: 10 }}>
                            {rodada != null ? `Fase ${rodada}` : 'Partidas'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {rodadaPartidas.map(p => <MatchCard key={p.id} partida={p} isAdmin={isAdmin} onRegistrar={() => setModalPartida(p)} onRefresh={onRefresh} />)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {tab === 'posicoes' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans', fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500 }}>#</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500 }}>Blade</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500 }}>Pts</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500 }}>V</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500 }}>E</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500 }}>D</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500 }}>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classGrupo.map((c, i) => {
                      const classify = i < 2
                      const perfil = grupoPartidas.find(p => p.blade1_id === c.blade_id)?.blade1 ?? grupoPartidas.find(p => p.blade2_id === c.blade_id)?.blade2
                      return (
                        <tr key={c.blade_id} style={{ borderBottom: '1px solid var(--color-border)', background: classify ? 'rgba(43,91,232,0.06)' : 'transparent' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 4, background: classify ? 'var(--color-blue-primary)' : 'transparent', color: classify ? '#fff' : 'var(--color-text-muted)', fontSize: 12 }}>{i + 1}</span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: classify ? 600 : 400, color: classify ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{perfil?.username ?? c.blade_id.slice(0, 8)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16, color: 'var(--color-blue-light)' }}>{c.pontos}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-success)' }}>{c.vitorias}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-warning)' }}>{c.empates}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--color-danger)' }}>{c.derrotas}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: c.saldo > 0 ? 'var(--color-success)' : c.saldo < 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{c.saldo > 0 ? `+${c.saldo}` : c.saldo}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )
      })}
      {modalPartida && <ResultadoModal partida={modalPartida} onClose={() => setModalPartida(null)} onSaved={() => { setModalPartida(null); onRefresh?.() }} />}
    </div>
  )
}
