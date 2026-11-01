import { useEffect, useId, useRef, useState } from 'react'
import { TIPO_LABELS, type TipoProblema } from '../../types'

const TIPOS: TipoProblema[] = ['quebrado', 'acidente', 'atraso', 'lotacao', 'outro']

interface TipoSelectProps {
  value: TipoProblema
  onChange: (tipo: TipoProblema) => void
}

export function TipoSelect({ value, onChange }: TipoSelectProps) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const listaId = useId()

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

  function escolher(tipo: TipoProblema) {
    onChange(tipo)
    setAberto(false)
  }

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
        aria-label="Tipo de problema"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listaId}
        onClick={() => setAberto((a) => !a)}
        className="input-brand flex items-center justify-between gap-2 text-left"
      >
        <span className="truncate font-semibold">{TIPO_LABELS[value]}</span>
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
          className={`shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div className="card-brand absolute inset-x-0 top-full z-[1000] mt-2 overflow-hidden !bg-brand-cream">
          <div id={listaId} role="listbox" aria-label="Tipos de problema">
            {TIPOS.map((tipo) => {
              const ativo = tipo === value
              return (
                <button
                  key={tipo}
                  type="button"
                  role="option"
                  aria-selected={ativo}
                  onClick={() => escolher(tipo)}
                  className={`flex min-h-11 w-full items-center gap-3 border-b border-brand-green/15 px-3 py-2 text-left text-sm last:border-b-0 ${
                    ativo
                      ? 'bg-brand-green/10 font-bold'
                      : 'active:bg-brand-green/10 hover:bg-brand-green/5'
                  }`}
                >
                  <span className="min-w-0 flex-1">{TIPO_LABELS[tipo]}</span>
                  {ativo && (
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
