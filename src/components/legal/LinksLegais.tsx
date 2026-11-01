import { Link } from 'react-router-dom'
import { ROTAS_LEGAIS } from '../../lib/legal'

interface LinksLegaisProps {
  /** `claro` para fundos verdes, `escuro` para fundos claros. */
  variante?: 'claro' | 'escuro'
  /** Abre numa nova aba (para não perder o que a pessoa já preencheu num formulário). */
  novaAba?: boolean
  className?: string
}

export function LinksLegais({ variante = 'escuro', novaAba = false, className = '' }: LinksLegaisProps) {
  const cor = variante === 'claro' ? 'text-brand-cream' : 'text-brand-green'
  const extra = novaAba ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  const link = `inline-flex min-h-11 items-center font-bold underline ${cor}`

  return (
    <nav aria-label="Documentos legais" className={`flex flex-wrap items-center justify-center gap-x-4 text-sm ${className}`}>
      <Link to={ROTAS_LEGAIS.privacidade} className={link} {...extra}>
        Política de Privacidade
      </Link>
      <Link to={ROTAS_LEGAIS.termos} className={link} {...extra}>
        Termos de Uso
      </Link>
    </nav>
  )
}
