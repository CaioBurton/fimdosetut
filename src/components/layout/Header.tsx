import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Header({ title }: { title: string }) {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center gap-3 bg-brand-green px-4 text-brand-cream">
      <Link to="/" aria-label="Fórum Piauiense de Luta pelo Transporte Público">
        <img
          src="/brand/logo-horizontal-claro.svg"
          alt="Fórum Piauiense de Luta pelo Transporte Público"
          className="block h-12 w-auto max-w-none"
        />
      </Link>
      <h1 className="ttl min-w-0 flex-1 truncate py-1 pr-1.5 text-right text-xl">{title}</h1>
      {user ? (
        <button
          onClick={() => signOut()}
          className="ttl min-h-11 rounded-[2px] border-2 border-brand-cream px-3.5 text-[13px] !font-bold !not-italic active:bg-brand-cream active:text-brand-green"
        >
          Sair
        </button>
      ) : (
        <Link
          to="/login"
          className="ttl flex min-h-11 items-center rounded-[2px] border-2 border-brand-cream px-3.5 text-[13px] !font-bold !not-italic active:bg-brand-cream active:text-brand-green"
        >
          Entrar
        </Link>
      )}
    </header>
  )
}
