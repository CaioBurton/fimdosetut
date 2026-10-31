import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const linkBase =
  'mx-1 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[2px] py-2 text-xs font-bold'

function activeClass(isActive: boolean) {
  return isActive ? 'bg-brand-green text-brand-cream' : 'text-brand-green'
}

export function BottomNav() {
  const { user } = useAuth()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t-[3px] border-brand-green bg-brand-cream pb-[env(safe-area-inset-bottom)]">
      <NavLink to="/" end className={({ isActive }) => `${linkBase} ${activeClass(isActive)}`}>
        <MapIcon />
        Mapa
      </NavLink>
      <NavLink
        to="/denuncias"
        className={({ isActive }) => `${linkBase} ${activeClass(isActive)}`}
      >
        <ListIcon />
        Lista
      </NavLink>
      <NavLink
        to="/nova"
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-bold"
      >
        <span className="relative -mt-7 flex h-12 w-[78px] items-center justify-center text-brand-cream">
          <img src="/brand/explosao-cheia.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full" />
          <span className="relative"><PlusIcon /></span>
        </span>
        <span className="mt-1 text-brand-green">Reportar</span>
      </NavLink>
      <NavLink
        to={user ? '/minhas' : '/login'}
        className={({ isActive }) => `${linkBase} ${activeClass(isActive)}`}
      >
        <UserIcon />
        {user ? 'Minhas' : 'Entrar'}
      </NavLink>
    </nav>
  )
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 20l-6-2V4l6 2 6-2 6 2v14l-6-2-6 2z" strokeLinejoin="round" />
      <path d="M9 6v14M15 4v14" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}
