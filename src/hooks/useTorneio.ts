import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Torneio, Partida, Inscricao, Ranking } from '@/types'

export function useTorneio(torneioId: string) {
  const [torneio, setTorneio] = useState<Torneio | null>(null)
  const [partidas, setPartidas] = useState<Partida[]>([])
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([])
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [partidasError, setPartidasError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [t, p, i, rt] = await Promise.all([
        supabase.from('torneios').select('*').eq('id', torneioId).single(),
        supabase.from('partidas')
          .select('*, blade1:perfis!blade1_id(id, username, nome_display, avatar_url), blade2:perfis!blade2_id(id, username, nome_display, avatar_url), juiz:perfis!juiz_id(id, username, nome_display, avatar_url)')
          .eq('torneio_id', torneioId)
          .order('numero_rodada', { nullsFirst: true })
          .order('posicao_bracket', { nullsFirst: true })
          .order('created_at'),
        supabase.from('inscricoes').select('*, perfil:perfis(id, username, nome_display, avatar_url)').eq('torneio_id', torneioId).eq('status', 'aprovado'),
        supabase.from('ranking_torneios').select('ranking:rankings(*)').eq('torneio_id', torneioId),
      ])
      if (t.error) console.error('[useTorneio] torneio:', t.error)
      if (p.error) { console.error('[useTorneio] partidas:', p.error); setPartidasError(p.error.message) }
      else setPartidasError(null)
      if (i.error) console.error('[useTorneio] inscricoes:', i.error)
      setTorneio(t.data as Torneio)
      setPartidas((p.data ?? []) as Partida[])
      setInscricoes((i.data ?? []) as Inscricao[])
      setRankings(((rt.data ?? []).map((r: any) => r.ranking).filter(Boolean)) as Ranking[])
    } catch (e) {
      console.error('[useTorneio] load error:', e)
    } finally {
      setLoading(false)
    }
  }, [torneioId])

  const preencherChaveamento = useCallback(async () => {
    // Busca direto do banco os inscritos que estão com status aprovado
    const { data: inscritosAprovados } = await supabase
      .from('inscricoes')
      .select('blade_id, perfil_id')
      .eq('torneio_id', torneioId)
      .eq('status', 'aprovado');

    if (!inscritosAprovados || inscritosAprovados.length === 0) {
      alert("Nenhum participante aprovado encontrado! Aprove as inscrições primeiro.");
      return;
    }

    // Busca as partidas da rodada 1 da chave de vencedores
    const { data: partidasR1, error } = await supabase
      .from('partidas')
      .select('*')
      .eq('torneio_id', torneioId)
      .eq('numero_rodada', 1)
      .eq('fase', 'winners')
      .order('posicao_bracket', { ascending: true });

    if (error || !partidasR1) {
      console.error("Erro ao buscar partidas:", error);
      return;
    }

    // Mapeia os inscritos aprovados para as partidas vazias
    const updates = partidasR1.map((partida, index) => {
      const p1 = inscritosAprovados[index * 2] as any; 
      const p2 = inscritosAprovados[index * 2 + 1] as any;

      return {
        id: partida.id,
        blade1_id: p1?.blade_id || p1?.perfil_id || null, 
        blade2_id: p2?.blade_id || p2?.perfil_id || null,
        status: (p1 && p2) ? 'pendente' : 'bye'
      };
    });

    const { error: updateError } = await supabase
      .from('partidas')
      .upsert(updates);

    if (updateError) {
      console.error("Erro ao salvar chaveamento:", updateError);
    } else {
      await load();
      alert("Chaveamento preenchido com sucesso!");
    }
  }, [torneioId, load]);

  useEffect(() => {
    if (!torneioId) return
    void load()

    const channel = supabase
      .channel(`torneio-${torneioId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partidas', filter: `torneio_id=eq.${torneioId}` }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [torneioId, load])

  return { 
    torneio, 
    partidas, 
    inscricoes, 
    rankings, 
    loading, 
    reload: load, 
    partidasError, 
    preencherChaveamento 
  }
}