interface PaginacaoProps {
  pagina: number
  totalPaginas: number
  onChange: (pagina: number) => void
}

const botao =
  'ttl min-h-11 flex-1 rounded-[2px] border-2 border-brand-green px-3 text-sm disabled:cursor-not-allowed disabled:opacity-35'

export function Paginacao({ pagina, totalPaginas, onChange }: PaginacaoProps) {
  if (totalPaginas <= 1) return null

  return (
    <nav aria-label="Paginação" className="flex items-center gap-3 pt-2">
      <button
        type="button"
        className={`${botao} text-brand-green`}
        disabled={pagina <= 1}
        onClick={() => onChange(pagina - 1)}
      >
        ← Anterior
      </button>
      <span className="shrink-0 text-sm font-bold" aria-live="polite">
        Página {pagina} de {totalPaginas}
      </span>
      <button
        type="button"
        className={`${botao} bg-brand-green text-brand-cream`}
        disabled={pagina >= totalPaginas}
        onClick={() => onChange(pagina + 1)}
      >
        Próxima →
      </button>
    </nav>
  )
}
