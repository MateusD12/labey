import { useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { TabelaRanking } from '@/components/ranking/TabelaRanking'
import { useRanking } from '@/hooks/useRanking'

export default function Rankings() {
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const { rankings, entradas, loading } = useRanking(selectedId)

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: 'Rajdhani', fontSize: '32px', fontWeight: 700, marginBottom: 32 }}>Rankings</h1>

        {rankings.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {rankings.map(r => (
              <button key={r.id} onClick={() => setSelectedId(r.id)}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${selectedId === r.id ? 'var(--color-blue-primary)' : 'var(--color-border)'}`, background: selectedId === r.id ? 'var(--color-blue-primary)' : 'var(--color-bg-card)', color: selectedId === r.id ? '#fff' : 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
                {r.nome} {r.temporada && `— ${r.temporada}`}
              </button>
            ))}
          </div>
        )}

        {loading
          ? <p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</p>
          : !selectedId
            ? <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: '40px', marginBottom: 16 }}>📊</div>
                <h3 style={{ fontFamily: 'Rajdhani', fontSize: '20px', marginBottom: 8 }}>Selecione um ranking</h3>
                <p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans', fontSize: '14px' }}>{rankings.length === 0 ? 'Nenhum ranking criado ainda.' : 'Clique em um ranking acima para ver as posições.'}</p>
              </div>
            : entradas.length > 0
              ? <div className="card" style={{ padding: 0, overflow: 'hidden' }}><TabelaRanking entradas={entradas} /></div>
              : <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Nenhuma entrada neste ranking ainda.</p>
                </div>
        }
      </main>
    </>
  )
}
