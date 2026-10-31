import type { ReactNode } from 'react'
import { STATUS_LABELS, TIPO_LABELS, ZONA_COLORS, ZONA_LABELS, type Denuncia } from '../../types'
import { Badge } from '../ui/Badge'

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DenunciaCard({ denuncia, actions }: { denuncia: Denuncia; actions?: ReactNode }) {
  const zona = denuncia.linha?.zona ?? 'outras'
  const cor = ZONA_COLORS[zona]

  return (
    <div className="card-brand p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-brand-green-dark">
            {denuncia.linha ? `${denuncia.linha.codigo} - ${denuncia.linha.nome}` : 'Linha removida'}
          </p>
          <p className="text-xs text-brand-green-dark/70">{formatarData(denuncia.created_at)}</p>
        </div>
        <Badge color={denuncia.status === 'resolvido' ? '#6b7280' : '#c23838'}>
          {STATUS_LABELS[denuncia.status]}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge color={cor}>{ZONA_LABELS[zona]}</Badge>
        <Badge color="#084400" outlined>
          {TIPO_LABELS[denuncia.tipo]}
        </Badge>
        {denuncia.numero_veiculo && (
          <Badge color="#084400" outlined>
            Veículo {denuncia.numero_veiculo}
          </Badge>
        )}
      </div>
      <p className="mt-2 text-sm text-brand-green-dark/90">{denuncia.descricao}</p>
      {actions && <div className="mt-3 flex gap-2">{actions}</div>}
    </div>
  )
}
