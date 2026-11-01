import type { ReactNode } from 'react'

interface SecaoNumeradaProps {
  numero: number
  titulo: string
  subtitulo: string
  children: ReactNode
}

export function SecaoNumerada({ numero, titulo, subtitulo, children }: SecaoNumeradaProps) {
  const id = `secao-${numero}`
  return (
    <section aria-labelledby={id} className="space-y-3.5">
      <div className="flex items-center gap-3">
        <span className="relative flex h-[34px] w-[52px] shrink-0 items-center justify-center" aria-hidden="true">
          <img src="/brand/explosao-cheia.svg" alt="" className="absolute inset-0 h-full w-full" />
          <span className="ttl relative text-lg leading-none text-brand-cream">{numero}</span>
        </span>
        <div>
          <h2 id={id} className="ttl text-[22px] leading-none">
            {titulo}
          </h2>
          <p className="mt-[3px] text-[13px] font-semibold text-brand-green-dark/70">{subtitulo}</p>
        </div>
      </div>
      <div className="card-brand space-y-3.5 p-4">{children}</div>
    </section>
  )
}
