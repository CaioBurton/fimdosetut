interface BotaoTambemViProps {
  total: number
  confirmado: boolean
  carregando?: boolean
  onClick: () => void
}

/** "Também vi": a pessoa confirma que viu o mesmo problema. Mostra quantas já confirmaram. */
export function BotaoTambemVi({ total, confirmado, carregando = false, onClick }: BotaoTambemViProps) {
  return (
    <button
      type="button"
      aria-pressed={confirmado}
      disabled={carregando}
      onClick={onClick}
      className={`chip-brand ${confirmado ? 'chip-brand-ativo' : ''} disabled:opacity-50`}
    >
      {confirmado ? '✓ Também vi' : 'Também vi'}
      {total > 0 && (
        <span aria-label={`${total} ${total === 1 ? 'confirmação' : 'confirmações'}`}> · {total}</span>
      )}
    </button>
  )
}
