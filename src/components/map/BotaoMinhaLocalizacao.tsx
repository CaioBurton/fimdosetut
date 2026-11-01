/** Botão de mira para levar o mapa até a localização atual. Posicionado por quem o usa (`className`). */
export function BotaoMinhaLocalizacao({
  onClick,
  buscando = false,
  className = '',
}: {
  onClick: () => void
  buscando?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={buscando}
      aria-label={buscando ? 'Buscando localização...' : 'Usar minha localização atual'}
      title="Usar minha localização atual"
      className={`z-[500] flex h-10 w-10 items-center justify-center rounded-[2px] border-2 border-brand-green bg-brand-cream text-brand-green shadow-[2px_2px_0_#084400] disabled:opacity-50 ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" className={buscando ? 'animate-pulse' : undefined}>
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="8" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </button>
  )
}
