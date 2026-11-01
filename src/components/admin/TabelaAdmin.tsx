import type { ReactNode } from 'react'

/** Moldura de tabela do admin no desktop: cabeçalho verde, bordas e sombra do estilo de cartaz. */
export function TabelaAdmin({
  legenda,
  colunas,
  children,
  minLargura = 720,
}: {
  legenda: string
  colunas: { rotulo: string; direita?: boolean }[]
  children: ReactNode
  minLargura?: number
}) {
  return (
    <div className="overflow-x-auto rounded-[2px] border-2 border-brand-green bg-white shadow-[4px_4px_0_#084400]">
      <table className="w-full border-collapse" style={{ minWidth: minLargura }}>
        <caption className="sr-only">{legenda}</caption>
        <thead>
          <tr>
            {colunas.map((c) => (
              <th
                key={c.rotulo}
                scope="col"
                className={`whitespace-nowrap bg-brand-green px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-brand-cream ${
                  c.direita ? 'text-right' : 'text-left'
                }`}
              >
                {c.rotulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export const celula = 'border-t border-[#cfe3c6] px-3.5 py-2.5 align-middle text-sm font-semibold'

export const botaoTabela =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-[2px] border-2 border-brand-green bg-brand-cream px-3 text-[13px] font-bold text-brand-green disabled:cursor-not-allowed disabled:opacity-35'

export const botaoPerigoTabela = `${botaoTabela} !border-[#c23838] !text-[#c23838]`

/** "Mostrando 1–10 de 148" com os botões anterior e próxima. */
export function RodapeTabela({
  inicio,
  fim,
  total,
  pagina,
  totalPaginas,
  onChange,
}: {
  inicio: number
  fim: number
  total: number
  pagina: number
  totalPaginas: number
  onChange: (pagina: number) => void
}) {
  if (total === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] font-bold text-[#2f5a28]">
      <span aria-live="polite">
        Mostrando {inicio}–{fim} de {total}
      </span>
      {totalPaginas > 1 && (
        <nav aria-label="Paginação" className="flex gap-2">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => onChange(pagina - 1)}
            className="min-h-11 rounded-[2px] border-2 border-brand-green px-4 text-brand-green disabled:opacity-35"
          >
            ← Anterior
          </button>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => onChange(pagina + 1)}
            className="min-h-11 rounded-[2px] border-2 border-brand-green bg-brand-green px-4 text-brand-cream disabled:opacity-35"
          >
            Próxima →
          </button>
        </nav>
      )}
    </div>
  )
}
