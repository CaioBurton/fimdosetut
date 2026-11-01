import type { ReactNode } from 'react'

/** Título grande das telas de desktop, com subtítulo e, à direita, ações opcionais. */
export function CabecalhoPagina({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string
  subtitulo?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="ttl text-[52px] leading-[0.9]">{titulo}</h2>
        {subtitulo && <p className="mt-2 text-[15px] font-medium text-[#2f5a28]">{subtitulo}</p>}
      </div>
      {children}
    </div>
  )
}
