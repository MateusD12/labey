export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    rascunho: 'Rascunho',
    inscricoes: 'Inscrições abertas',
    em_andamento: 'Em andamento',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
    finalizada: 'Finalizada',
  }
  return map[status] ?? status
}

export function formatFormato(formato: string): string {
  const map: Record<string, string> = {
    eliminatorio_simples: 'Eliminatório Simples',
    eliminatorio_duplo: 'Eliminatório Duplo',
    fase_grupos: 'Fase de Grupos',
    copa_do_mundo: 'Copa do Mundo',
    suico: 'Sistema Suíço',
    round_robin: 'Round Robin',
  }
  return map[formato] ?? formato
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    rascunho: 'var(--color-text-muted)',
    inscricoes: 'var(--color-success)',
    em_andamento: 'var(--color-warning)',
    finalizado: 'var(--color-text-secondary)',
    cancelado: 'var(--color-danger)',
  }
  return map[status] ?? 'var(--color-text-muted)'
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
