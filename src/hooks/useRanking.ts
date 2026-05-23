import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Ranking, RankingEntrada } from '@/types'

export function useRanking(rankingId?: string) {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [entradas, setEntradas] = useState<RankingEntrada[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      const { data: r } = await supabase.from('rankings').select('*').eq('ativo', true).order('created_at')
      setRankings((r ?? []) as Ranking[])

      if (rankingId) {
        const { data: e } = await supabase
          .from('ranking_entradas')
          .select('*, perfil:perfis(id, username, nome_display, avatar_url)')
          .eq('ranking_id', rankingId)
          .order('posicao')
        setEntradas((e ?? []) as RankingEntrada[])
      } else {
        setEntradas([])
      }
      setLoading(false)
    }
    load()
  }, [rankingId])

  return { rankings, entradas, loading }
}
