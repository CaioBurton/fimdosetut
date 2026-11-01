import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { TIPO_FEEDBACK_LABELS, type TipoFeedback } from '../../types'
import { Button } from '../ui/Button'
import { TituloSecao } from '../ui/TituloSecao'

const TIPOS: TipoFeedback[] = ['sugestao', 'problema', 'elogio']
const LIMITE = 1000

export function EnviarFeedback({ userId }: { userId: string }) {
  const [tipo, setTipo] = useState<TipoFeedback>('sugestao')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const texto = mensagem.trim()
    if (!texto) {
      setErro('Escreva sua mensagem antes de enviar.')
      return
    }
    setEnviando(true)
    setErro(null)
    const { error } = await supabase
      .from('feedbacks')
      .insert({ user_id: userId, tipo, mensagem: texto })
    setEnviando(false)
    if (error) {
      setErro('Não foi possível enviar seu feedback. Tente novamente.')
      return
    }
    setMensagem('')
    setEnviado(true)
  }

  return (
    <section aria-labelledby="perfil-feedback">
      <TituloSecao id="perfil-feedback">Sua opinião</TituloSecao>
      <form onSubmit={enviar} className="card-brand space-y-3.5 p-4">
        <p className="text-sm font-medium text-brand-green-dark/80">
          Conte o que está bom, o que está ruim ou o que podemos melhorar no app.
        </p>

        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide">Tipo</legend>
          <div className="grid grid-cols-3 overflow-hidden rounded-[2px] border-2 border-brand-green">
            {TIPOS.map((t, i) => (
              <label
                key={t}
                className={`flex min-h-11 cursor-pointer items-center justify-center px-1 text-center text-[13px] font-bold ${
                  i > 0 ? 'border-l-2 border-brand-green' : ''
                } ${tipo === t ? 'bg-brand-green text-brand-cream' : 'bg-brand-cream text-brand-green'}`}
              >
                <input
                  type="radio"
                  name="tipo-feedback"
                  value={t}
                  checked={tipo === t}
                  onChange={() => {
                    setTipo(t)
                    setEnviado(false)
                  }}
                  className="sr-only"
                />
                {TIPO_FEEDBACK_LABELS[t]}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="feedback-mensagem" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
            Mensagem
          </label>
          <textarea
            id="feedback-mensagem"
            rows={4}
            maxLength={LIMITE}
            value={mensagem}
            onChange={(e) => {
              setMensagem(e.target.value)
              setEnviado(false)
              setErro(null)
            }}
            placeholder="Escreva aqui..."
            className="input-brand !py-3"
          />
          <p className="mt-1 text-right text-xs font-semibold text-brand-green-dark/70">
            {mensagem.length}/{LIMITE}
          </p>
        </div>

        {erro && (
          <p role="alert" className="text-sm font-semibold text-zona-leste">
            {erro}
          </p>
        )}
        {enviado && (
          <p role="status" className="flex items-center gap-2 text-sm font-bold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12l5 5 9-10" />
            </svg>
            Obrigado! Seu feedback foi enviado.
          </p>
        )}

        <Button type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar feedback'}
        </Button>
      </form>
    </section>
  )
}
