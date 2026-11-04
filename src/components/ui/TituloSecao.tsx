import { useId, type ReactNode } from 'react'

interface TituloSecaoProps {
  id?: string
  children: ReactNode
  /** Explicação curta mostrada num tooltip ao lado do título. */
  dica?: ReactNode
}

export function TituloSecao({ id, children, dica }: TituloSecaoProps) {
  const idDica = useId()
  return (
    <div className="relative mb-3.5 flex items-center gap-2.5">
      <h2 id={id} className="ttl text-[22px] leading-none">
        {children}
      </h2>
      {dica && (
        <span className="group shrink-0">
          <button
            type="button"
            aria-label="Como funciona"
            aria-describedby={idDica}
            className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-green text-[11px] font-bold leading-none text-brand-green"
          >
            ?
          </button>
          <span
            id={idDica}
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-64 max-w-full rounded-[2px] bg-brand-green-dark px-3 py-2 text-left text-xs font-semibold leading-snug text-brand-cream shadow-lg group-hover:block group-focus-within:block"
          >
            {dica}
          </span>
        </span>
      )}
      <i className="block h-[3px] flex-1 bg-brand-green" aria-hidden="true" />
    </div>
  )
}
