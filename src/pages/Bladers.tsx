import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { BladersLayout } from '@/components/bladers/BladersLayout'
import { supabase } from '@/lib/supabase'
import type { EstatisticasBlade } from '@/types'

export default function Bladers() {
  const [bladers, setBladers] = useState<EstatisticasBlade[]>([])
  const [rankingMap, setRankingMap] = useState<Record<string, { posicao: number; pontos: number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('estatisticas_blades').select('*').order('total_vitorias', { ascending: false }),
      supabase.from('ranking_entradas').select('blade_id, posicao, pontos').eq('ranking_id', 'f0000001-0000-4000-a000-000000000001').order('posicao'),
    ]).then(([{ data: b }, { data: re }]) => {
      if (b) setBladers(b as EstatisticasBlade[])
      if (re) {
        const map: Record<string, { posicao: number; pontos: number }> = {}
        re.forEach((r: { blade_id: string; posicao: number; pontos: number }) => { map[r.blade_id] = { posicao: r.posicao, pontos: r.pontos } })
        setRankingMap(map)
      }
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-muted)', fontFamily: 'DM Sans' }}>Carregando...</div>
    </>
  )

  return (
    <>
      <Navbar />
      <BladersLayout bladers={bladers} rankingMap={rankingMap} />
    </>
  )
}
