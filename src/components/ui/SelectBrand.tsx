import { useEffect, useId, useRef, useState } from 'react'

interface SelectBrandProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

/** Dropdown no mesmo estilo do "Tipo de problema" e da "Linha": botão com seta e lista em cartão. */
export function SelectBrand<T extends string>({ label, value, options, onChange }: SelectBrandProps<T>) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const listaId = useId()
  const atual = options.find((o) => o.value === value)

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
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listaId}
        onClick={() => setAberto((a) => !a)}
        className="input-brand flex items-center justify-between gap-2 text-left"
      >
        <span className="truncate font-bold">{atual?.label}</span>
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
        <div className="card-brand anim-abre absolute inset-x-0 top-full z-[1000] mt-2 overflow-hidden !bg-brand-cream">
          <div id={listaId} role="listbox" aria-label={label}>
            {options.map((o) => {
              const ativo = o.value === value
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={ativo}
                  onClick={() => {
                    onChange(o.value)
                    setAberto(false)
                  }}
                  className={`flex min-h-11 w-full items-center gap-3 border-b border-brand-green/15 px-3 py-2 text-left text-[15px] font-semibold last:border-b-0 ${
                    ativo ? 'bg-brand-green/10 font-bold' : 'active:bg-brand-green/10 hover:bg-brand-green/5'
                  }`}
                >
                  <span className="min-w-0 flex-1">{o.label}</span>
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
