import { useEffect, useId, useRef, useState } from 'react'
import { TIPO_LABELS, type TipoProblema } from '../../types'

const TIPOS: TipoProblema[] = ['quebrado', 'acidente', 'atraso', 'lotacao', 'outro']

function IconeTipo({ tipo }: { tipo: TipoProblema }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'shrink-0',
  }
  switch (tipo) {
    case 'quebrado':
      return (
        <svg {...props}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />
        </svg>
      )
    case 'acidente':
      return (
        <svg {...props}>
          <path d="M12 3l10 18H2L12 3z" />
          <path d="M12 10v5M12 18h.01" />
        </svg>
      )
    case 'atraso':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'lotacao':
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
          <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.7 4 2.6 4 5" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <circle cx="5" cy="12" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
        </svg>
      )
  }
}

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
        <span className="flex min-w-0 items-center gap-2.5 font-bold">
          <IconeTipo tipo={value} />
          <span className="truncate">{TIPO_LABELS[value]}</span>
        </span>
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
                  className={`flex min-h-[52px] w-full items-center gap-3 border-b border-brand-green/15 px-3 py-2 text-left text-[15px] font-semibold last:border-b-0 ${
                    ativo
                      ? 'bg-brand-green/10 font-bold'
                      : 'active:bg-brand-green/10 hover:bg-brand-green/5'
                  }`}
                >
                  <IconeTipo tipo={tipo} />
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
