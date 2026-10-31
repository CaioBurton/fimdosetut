import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const linkBase =
  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium'

function activeClass(isActive: boolean) {
  return isActive ? 'text-brand-green' : 'text-brand-green-dark/50'
}

export function BottomNav() {
  const { user } = useAuth()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-brand-green/15 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
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
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium"
      >
        <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-brand-green text-white shadow-lg shadow-brand-green/30">
          <PlusIcon />
        </span>
        <span className="text-brand-green-dark/50">Reportar</span>
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
