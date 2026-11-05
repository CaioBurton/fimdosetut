interface PaginacaoProps {
  pagina: number
  totalPaginas: number
  onChange: (pagina: number) => void
}

const botao =
  'ttl min-h-11 flex-1 rounded-[2px] border-2 border-brand-green px-3 text-sm disabled:cursor-not-allowed disabled:opacity-35'

/** Leva ao topo o container que rola (a lista) e a janela, para a nova página começar do início. */
function voltarAoTopo(nav: HTMLElement | null) {
  for (let el = nav?.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      el.scrollTop = 0
    }
  }
  window.scrollTo?.(0, 0)
}

export function Paginacao({ pagina, totalPaginas, onChange }: PaginacaoProps) {
  if (totalPaginas <= 1) return null

  function mudar(nova: number, nav: HTMLElement | null) {
    onChange(nova)
    voltarAoTopo(nav)
  }

  return (
    <nav aria-label="Paginação" className="flex items-center gap-3 pt-2">
      <button
        type="button"
        className={`${botao} text-brand-green`}
        disabled={pagina <= 1}
        onClick={(e) => mudar(pagina - 1, e.currentTarget.closest('nav'))}
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
        onClick={(e) => mudar(pagina + 1, e.currentTarget.closest('nav'))}
      >
        Próxima →
      </button>
    </nav>
  )
}
