import { Link } from 'react-router-dom'
import type { Torneio } from '@/types'
import { formatDate, formatFormato, getStatusColor } from '@/lib/utils'
import { Calendar, Users, Trophy } from 'lucide-react'

export function CardTorneio({ torneio }: { torneio: Torneio }) {
  return (
    <Link to={`/torneios/${torneio.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 160 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ fontFamily: 'Rajdhani', fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
            {torneio.nome}
          </h3>
          <span style={{ fontSize: '11px', fontFamily: 'DM Sans', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: `${getStatusColor(torneio.status)}22`, color: getStatusColor(torneio.status), whiteSpace: 'nowrap', marginLeft: 8 }}>
            {torneio.status === 'inscricoes' ? 'Inscrições abertas' :
             torneio.status === 'em_andamento' ? 'Em andamento' :
             torneio.status === 'finalizado' ? 'Finalizado' :
             torneio.status === 'rascunho' ? 'Rascunho' : 'Cancelado'}
          </span>
        </div>

        {torneio.descricao && (
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'DM Sans', fontSize: '13px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
            {torneio.descricao}
          </p>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 'auto', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'DM Sans' }}>
            <Trophy size={12} />
            {formatFormato(torneio.formato)}
          </span>
          {torneio.data_inicio && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'DM Sans' }}>
              <Calendar size={12} />
              {formatDate(torneio.data_inicio)}
            </span>
          )}
          {torneio.max_participantes && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'DM Sans' }}>
              <Users size={12} />
              Até {torneio.max_participantes}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
