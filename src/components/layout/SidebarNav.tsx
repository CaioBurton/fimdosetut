import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const base =
  'flex min-h-[46px] items-center gap-3 rounded-[2px] border-2 border-transparent px-3.5 text-[15px] font-bold hover:border-brand-cream'

function classe(ativo: boolean) {
  return `${base} ${ativo ? 'bg-brand-cream text-brand-green' : 'text-brand-cream'}`
}

function Item({ para, fim = false, children }: { para: string; fim?: boolean; children: ReactNode }) {
  return (
    <NavLink to={para} end={fim} className={({ isActive }) => classe(isActive)}>
      {children}
    </NavLink>
  )
}

const ic = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

/** Menu lateral do layout de desktop: faz o papel do cabeçalho e da barra de baixo do celular. */
const SECOES_ADMIN = [
  { id: 'painel', rotulo: 'Painel' },
  { id: 'denuncias', rotulo: 'Denúncias' },
  { id: 'linhas', rotulo: 'Linhas' },
  { id: 'usuarios', rotulo: 'Usuários' },
  { id: 'feedbacks', rotulo: 'Feedbacks' },
]

export function SidebarNav() {
  const { user, isAnonymous, isAdmin, signOut } = useAuth()
  const logado = !!user && !isAnonymous
  const local = useLocation()
  const naAdmin = isAdmin && local.pathname.startsWith('/admin')
  const secaoAtual = new URLSearchParams(local.search).get('aba') ?? 'painel'

  return (
    <aside className="relative flex w-60 shrink-0 flex-col gap-6 overflow-hidden bg-brand-green px-4 py-6 text-brand-cream">
      {/* Vem primeiro no DOM: assim fica atrás dos itens do menu, que são `relative`. */}
      <img
        src="/brand/catraca.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-7 left-5 w-44 max-w-none opacity-35 brightness-[2.2]"
      />
      <Link to="/" aria-label="Fórum Piauiense de Luta pelo Transporte Público" className="relative self-start">
        <img
          src="/brand/logo-horizontal-claro.svg"
          alt="Fórum Piauiense de Luta pelo Transporte Público"
          className="block h-[60px] w-auto max-w-none"
        />
      </Link>

      <nav aria-label="Principal" className="relative flex flex-col gap-1.5">
        <Item para="/" fim>
          <svg {...ic}><path d="M9 20l-6-2V4l6 2 6-2 6 2v14l-6-2-6 2z" /><path d="M9 6v14M15 4v14" /></svg>
          Mapa
        </Item>
        <Item para="/denuncias">
          <svg {...ic}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
          Lista
        </Item>
        {logado && (
          <Item para="/minhas">
            <svg {...ic}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
            Perfil
          </Item>
        )}
        {isAdmin ? (
          <Item para="/admin">
            <svg {...ic}><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
            Admin
          </Item>
        ) : (
          <Item para="/painel">
            <svg {...ic}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>
            Painel
          </Item>
        )}
      </nav>

      {naAdmin && (
        <div className="relative flex min-h-0 flex-col">
          {/* min-h-0 + overflow: se faltar altura, só as seções do admin rolam; "Reportar" e "Sair" ficam sempre visíveis. */}
          <p className="mb-1.5 shrink-0 px-1 text-xs font-bold uppercase tracking-[0.08em] opacity-80">Administração</p>
          <nav aria-label="Seções do admin" className="scroll-visivel flex min-h-0 flex-col gap-1 overflow-y-auto">
            {SECOES_ADMIN.map((s) => (
              <Link
                key={s.id}
                to={`/admin?aba=${s.id}`}
                aria-current={secaoAtual === s.id ? 'page' : undefined}
                className={classe(secaoAtual === s.id)}
              >
                {s.rotulo}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <NavLink
        to="/nova"
        className="ttl relative flex min-h-14 items-center justify-center gap-2.5 rounded-[2px] border-2 border-brand-cream bg-brand-cream text-lg text-brand-green shadow-[4px_4px_0_#052d00]"
      >
        <svg {...ic} strokeWidth={3.2} width={22} height={22}><path d="M12 5v14M5 12h14" /></svg>
        Reportar
      </NavLink>

      {logado ? (
        <button
          type="button"
          onClick={() => signOut()}
          className="relative mt-auto min-h-11 self-start rounded-[2px] border-2 border-brand-cream px-4 text-sm font-bold hover:bg-brand-cream hover:text-brand-green"
        >
          Sair
        </button>
      ) : (
        <Link
          to="/login"
          className="relative mt-auto flex min-h-11 items-center self-start rounded-[2px] border-2 border-brand-cream px-4 text-sm font-bold hover:bg-brand-cream hover:text-brand-green"
        >
          Entrar
        </Link>
      )}

    </aside>
  )
}
