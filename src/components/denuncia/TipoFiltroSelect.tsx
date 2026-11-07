import { useEffect, useId, useRef, useState } from 'react'
import { TIPO_LABELS, type TipoProblema } from '../../types'
import { IconeTipo, TIPOS } from './TipoSelect'

export type FiltroTipo = TipoProblema | 'todos'

interface TipoFiltroSelectProps {
  value: FiltroTipo
  onChange: (valor: FiltroTipo) => void
}

/** Lista suspensa de filtro, com o mesmo visual do seletor de linhas, na altura dos chips. */
export function TipoFiltroSelect({ value, onChange }: TipoFiltroSelectProps) {
  const ariaLabel = 'Filtrar por tipo de problema'
  const opcoes: { valor: FiltroTipo; rotulo: string }[] = [
    { valor: 'todos', rotulo: 'Todos os tipos' },
    ...TIPOS.map((t) => ({ valor: t, rotulo: TIPO_LABELS[t] })),
  ]
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const listaId = useId()
  const atual = opcoes.find((o) => o.valor === value)
  const icone = (v: FiltroTipo) => (v === 'todos' ? null : <IconeTipo tipo={v} />)

  useEffect(() => {
    if (!aberto) return
    function fora(e: MouseEvent | TouchEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fora)
    document.addEventListener('touchstart', fora)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('touchstart', fora)
    }
  }, [aberto])

  return (
    <div
      ref={raiz}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setAberto(false)
      }}
    >
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listaId}
        onClick={() => setAberto((a) => !a)}
        style={{ minHeight: 36, height: 36, width: 'auto', fontSize: 13 }}
        className="input-brand flex items-center justify-between gap-2 text-left"
      >
        <span className="flex min-w-0 items-center gap-2 font-bold">
          {icone(value)}
          <span className="truncate">{atual?.rotulo}</span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div className="card-brand absolute left-0 top-full z-[1000] mt-2 flex max-h-[320px] w-80 flex-col overflow-hidden !bg-brand-cream">
          <div id={listaId} role="listbox" aria-label={ariaLabel} className="scroll-visivel-claro overflow-y-auto overscroll-contain">
            {opcoes.map((o) => {
              const ativa = o.valor === value
              return (
                <button
                  key={o.valor}
                  type="button"
                  role="option"
                  aria-selected={ativa}
                  onClick={() => {
                    onChange(o.valor)
                    setAberto(false)
                  }}
                  className={`flex min-h-[52px] w-full items-center gap-3 border-b border-brand-green/15 px-3 py-2 text-left text-[15px] font-semibold last:border-b-0 ${
                    ativa ? 'bg-brand-green/10 font-bold' : 'active:bg-brand-green/10 hover:bg-brand-green/5'
                  }`}
                >
                  {icone(o.valor)}
                  <span className="min-w-0 flex-1">{o.rotulo}</span>
                  {ativa && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
