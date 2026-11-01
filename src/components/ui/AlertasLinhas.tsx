import { useAuth } from '../../hooks/useAuth'
import { useAlertasLinhas } from '../../hooks/useAlertasLinhas'
import { useLinhas } from '../../hooks/useLinhas'
import { TIPO_LABELS } from '../../types'

export function AlertasLinhas() {
  const { user } = useAuth()
  const { linhas } = useLinhas()
  const { alertas, dispensar } = useAlertasLinhas(user?.id, linhas)

  if (alertas.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[80px] z-[1500] flex flex-col gap-2 px-4">
      {alertas.map((alerta) => {
        const linha = linhas.find((l) => l.id === alerta.linhaId)
        return (
          <div
            key={alerta.id}
            role="alert"
            className="card-brand pointer-events-auto flex items-start gap-3 !bg-brand-cream p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="ttl text-sm text-brand-green">
                Problema na linha {linha ? `${linha.codigo} - ${linha.nome}` : ''}
              </p>
              <p className="text-sm text-brand-green-dark">
                <strong>{TIPO_LABELS[alerta.tipo]}</strong>: {alerta.descricao}
              </p>
            </div>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => dispensar(alerta.id)}
              className="min-h-8 min-w-8 text-lg font-bold text-brand-green"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
