import { useRef } from 'react'

/** Botão de calendário: abre o seletor de data do navegador e devolve o dia escolhido (yyyy-mm-dd). */
export function BotaoCalendario({
  dia,
  onChange,
  min,
  max,
}: {
  dia: string
  onChange: (dia: string) => void
  min: string
  max: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const ehHoje = dia === max
  const [ano, mes, d] = dia.split('-')

  function abrir() {
    const input = inputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
      input.click()
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={abrir}
        aria-label={`Escolher o dia das denúncias (${ehHoje ? 'hoje' : `${d}/${mes}/${ano}`})`}
        title="Escolher o dia das denúncias"
        className={`z-[500] flex h-10 w-10 items-center justify-center rounded-[2px] border-2 border-brand-green shadow-[2px_2px_0_#084400] ${
          ehHoje ? 'bg-brand-cream text-brand-green' : 'bg-brand-green text-brand-cream'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="1" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={dia}
        min={min}
        max={max}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
      />
    </div>
  )
}
