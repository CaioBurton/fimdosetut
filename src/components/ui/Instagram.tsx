export const INSTAGRAM_USUARIO = 'fimdosetut'
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_USUARIO}/`

interface InstagramProps {
  /** `claro` para fundos verdes, `escuro` para fundos claros. */
  variante?: 'claro' | 'escuro'
  className?: string
}

export function Instagram({ variante = 'escuro', className = '' }: InstagramProps) {
  const cores =
    variante === 'claro'
      ? 'border-brand-cream text-brand-cream'
      : 'border-brand-green text-brand-green'

  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Instagram do Fórum: @${INSTAGRAM_USUARIO} (abre em nova aba)`}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] border-2 px-4 text-sm font-bold ${cores} ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
      </svg>
      @{INSTAGRAM_USUARIO}
    </a>
  )
}
