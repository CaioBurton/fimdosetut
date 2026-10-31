import { useAuth } from '../../hooks/useAuth'

export function Header({ title }: { title: string }) {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-brand-green px-4 py-3 text-white shadow-sm">
      <h1 className="font-display text-lg font-extrabold tracking-tight">{title}</h1>
      {user && (
        <button
          onClick={() => signOut()}
          className="text-xs font-semibold text-white/80 underline-offset-2 active:underline"
        >
          Sair
        </button>
      )}
    </header>
  )
}
