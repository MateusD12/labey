export type Formato =
  | 'eliminatorio_simples'
  | 'eliminatorio_duplo'
  | 'fase_grupos'
  | 'copa_do_mundo'
  | 'suico'
  | 'round_robin'

export type StatusTorneio = 'rascunho' | 'inscricoes' | 'em_andamento' | 'finalizado' | 'cancelado'
export type StatusPartida = 'pendente' | 'em_andamento' | 'finalizada' | 'w.o.'

export interface Perfil {
  id: string
  username: string
  nome_display: string
  avatar_url?: string | null
  bio?: string | null
  cidade?: string | null
  estado?: string | null
  beyblade_favorito?: string | null
  is_admin: boolean
  is_juiz?: boolean
  created_at?: string
}

export interface Torneio {
  id: string
  nome: string
  descricao?: string | null
  formato: Formato
  status: StatusTorneio
  data_inicio?: string | null
  data_fim?: string | null
  regras?: string | null
  premio?: string | null
  banner_url?: string | null
  max_participantes?: number | null
  min_participantes?: number | null
  pontos_vitoria: number
  pontos_empate: number
  pontos_derrota: number
  num_grupos: number
  classificados_por_grupo: number
  num_rodadas_suico: number
  criador_id?: string | null
  created_at?: string
}

export interface Inscricao {
  id: string
  torneio_id: string
  blade_id: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  seed?: number | null
  grupo?: string | null
  checked_in?: boolean
  checked_in_at?: string | null
  perfil?: Perfil
}

export interface Partida {
  id: string
  torneio_id: string
  fase: string
  numero_rodada?: number | null
  grupo?: string | null
  posicao_bracket?: number | null
  blade1_id?: string | null
  blade2_id?: string | null
  blade1_score?: number | null
  blade2_score?: number | null
  vencedor_id?: string | null
  status: StatusPartida
  mesa?: string | null
  data_partida?: string | null
  observacoes?: string | null
  blade1?: Perfil | null
  blade2?: Perfil | null
  vencedor?: Perfil | null
  juiz_id?: string | null
  juiz?: Perfil | null
}

export interface TorneioJuiz {
  id: string
  torneio_id: string
  blade_id: string
  tipo: 'titular' | 'reserva'
  perfil?: Perfil
}

export interface Ranking {
  id: string
  nome: string
  descricao?: string | null
  temporada?: string | null
  ativo: boolean
}

export interface RankingEntrada {
  id: string
  ranking_id: string
  blade_id: string
  posicao: number
  pontos: number
  vitorias: number
  derrotas: number
  empates: number
  torneios_jogados: number
  perfil?: Perfil
}

export interface EstatisticasBlade {
  id: string
  username: string
  nome_display: string
  avatar_url?: string | null
  torneios_jogados: number
  total_vitorias: number
  total_derrotas: number
  titulos: number
}

export interface PostCm {
  id: string
  autor_id: string
  conteudo: string
  url?: string | null
  created_at: string
  autor?: Pick<Perfil, 'id' | 'username' | 'nome_display' | 'avatar_url'>
}

export interface ComentarioCm {
  id: string
  post_id: string
  autor_id: string
  conteudo: string
  created_at: string
  autor?: Pick<Perfil, 'id' | 'username' | 'nome_display' | 'avatar_url'>
}

export interface ReacaoAgregada {
  emoji: string
  count: number
  eu_reagi: boolean
}

// ─── BeybladeCombos integration ───────────────────────────────────────────────

export interface BeybladeRow {
  id?: string
  geracao: string
  serie: string
  peca: string
  tipo: string
  beyblade: string
  localizacao?: string
  image_id?: string
  storage_url?: string
  user_id?: string
}

export interface DeckPart { rowId: string }
export interface DeckBey { id: string; label: string; parts: DeckPart[]; wins: number; losses: number }
export interface Deck { id: string; name: string; beyblades: DeckBey[] }

export type SystemName = 'BX/UX' | 'CX' | 'CX Expend'

export interface ComboPart extends BeybladeRow {
  imageUrl: string | null
}
