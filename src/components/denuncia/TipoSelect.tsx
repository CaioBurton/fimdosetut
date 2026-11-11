import { useEffect, useId, useRef, useState } from 'react'
import { TIPO_LABELS, TIPOS_ONIBUS, type TipoProblema } from '../../types'

export const TIPOS: TipoProblema[] = TIPOS_ONIBUS

export function IconeTipo({ tipo }: { tipo: TipoProblema }) {
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
    case 'nao_passou':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M5.6 5.6l12.8 12.8" />
        </svg>
      )
    case 'ar_condicionado':
      return (
        <svg {...props}>
          <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
        </svg>
      )
    case 'gps':
      return (
        <svg {...props}>
          <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      )
    case 'pcd':
      return (
        <svg {...props}>
          <circle cx="12" cy="4.5" r="1.5" />
          <path d="M12 7v6h5l2 5M12 10h4" />
          <path d="M8.5 11.5a5 5 0 1 0 6.5 6.5" />
        </svg>
      )
    case 'parada_sem_abrigo':
      return (
        <svg {...props}>
          <path d="M3 9l9-5 9 5M5 9v11M19 9v11M3 20h18" />
        </svg>
      )
    case 'parada_sem_banco':
      return (
        <svg {...props}>
          <path d="M5 12h14M6 12v7M18 12v7M7 12V6h10v6" />
        </svg>
      )
    case 'parada_sem_placa':
      return (
        <svg {...props}>
          <path d="M12 3v18M6 5h12v6H6z" />
        </svg>
      )
    case 'parada_sujeira':
      return (
        <svg {...props}>
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        </svg>
      )
    case 'parada_sem_iluminacao':
      return (
        <svg {...props}>
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.3.3.5.7.5 1.1h6c0-.4.2-.8.5-1.1A6 6 0 0 0 12 3z" />
        </svg>
      )
    case 'parada_inseguranca':
      return (
        <svg {...props}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
        </svg>
      )
    case 'parada_pcd':
      return (
        <svg {...props}>
          <circle cx="12" cy="4.5" r="1.5" />
          <path d="M12 7v6h5l2 5M12 10h4" />
          <path d="M8.5 11.5a5 5 0 1 0 6.5 6.5" />
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
  /** Tipos oferecidos (padrão: os de ônibus). Para parada, passe `TIPOS_PARADA`. */
  tipos?: TipoProblema[]
}

export function TipoSelect({ value, onChange, tipos = TIPOS }: TipoSelectProps) {
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
          <div
            id={listaId}
            role="listbox"
            aria-label="Tipos de problema"
            className="scroll-visivel-claro max-h-[260px] overflow-y-auto overscroll-contain"
          >
            {tipos.map((tipo) => {
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
