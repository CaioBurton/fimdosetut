import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Header({ title }: { title: string }) {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between bg-brand-green px-4 text-brand-cream">
      <Link to="/" aria-label="Fórum Piauiense de Luta pelo Transporte Público">
        <img
          src="/brand/logo-horizontal-claro.svg"
          alt="Fórum Piauiense de Luta pelo Transporte Público"
          className="block h-12 w-auto"
        />
      </Link>
      <h1 className="sr-only">{title}</h1>
      {user && (
        <button
          onClick={() => signOut()}
          className="ttl min-h-11 rounded-[2px] border-2 border-brand-cream px-3.5 text-[13px] !font-bold !not-italic active:bg-brand-cream active:text-brand-green"
        >
          Sair
        </button>
      )}
    </header>
  )
}
