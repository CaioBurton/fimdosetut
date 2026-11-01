import { useState } from 'react'
import { useFeedbacks } from '../../hooks/useFeedbacks'
import { TIPO_FEEDBACK_LABELS } from '../../types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const COR_TIPO = { sugestao: '#084400', problema: '#c23838', elogio: '#307800' } as const

export function FeedbacksAdmin() {
  const { feedbacks, loading, error, excluir } = useFeedbacks()
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [acaoErro, setAcaoErro] = useState<string | null>(null)

  async function apagar(id: string) {
    setAcaoErro(null)
    const erro = await excluir(id)
    setConfirmando(null)
    if (erro) setAcaoErro(erro)
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
      {acaoErro && <p className="text-center text-sm text-zona-leste">{acaoErro}</p>}
      {loading && <p className="text-center text-brand-green-dark/60">Carregando...</p>}
      {!loading && !error && feedbacks.length === 0 && (
        <p className="py-10 text-center text-brand-green-dark/70">Nenhum feedback recebido ainda.</p>
      )}

      {feedbacks.map((f) => (
        <article key={f.id} className="card-brand space-y-2.5 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{f.perfil?.email ?? 'Conta removida'}</p>
              <p className="text-xs text-brand-green-dark/70">{formatarData(f.created_at)}</p>
            </div>
            <Badge color={COR_TIPO[f.tipo]}>{TIPO_FEEDBACK_LABELS[f.tipo]}</Badge>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm leading-snug">{f.mensagem}</p>
          <div className="flex gap-2">
            {confirmando === f.id ? (
              <>
                <Button
                  variant="ghost"
                  className="w-auto flex-1 py-2 text-sm text-zona-leste"
                  onClick={() => apagar(f.id)}
                >
                  Confirmar exclusão
                </Button>
                <Button
                  variant="secondary"
                  className="w-auto flex-1 py-2 text-sm"
                  onClick={() => setConfirmando(null)}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                className="w-auto py-2 text-sm text-zona-leste"
                onClick={() => setConfirmando(f.id)}
              >
                Excluir
              </Button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
