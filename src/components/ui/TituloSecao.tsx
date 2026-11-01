import type { ReactNode } from 'react'

export function TituloSecao({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <h2 id={id} className="ttl text-[22px] leading-none">
        {children}
      </h2>
      <i className="block h-[3px] flex-1 bg-brand-green" aria-hidden="true" />
    </div>
  )
}
