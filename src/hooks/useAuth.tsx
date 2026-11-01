import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  isAdmin: boolean
  /** Sessão sem cadastro (enviou denúncia sem criar conta). Pode virar conta com `vincularConta`. */
  isAnonymous: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    metadados?: Record<string, string>
  ) => Promise<{ error: string | null }>
  /** Cria uma sessão sem e-mail e senha, para a primeira denúncia sem cadastro. */
  signInAnonimo: (metadados?: Record<string, string>) => Promise<{ error: string | null }>
  /** Transforma a sessão sem cadastro em conta de verdade, mantendo as denúncias já enviadas. */
  vincularConta: (email: string, password: string, nome?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState<{ id: string; admin: boolean } | null>(null)
  const userId = session?.user.id ?? null

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return
    let active = true

    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (active) setPerfil({ id: userId, admin: data?.role === 'admin' })
        },
        () => {
          if (active) setPerfil({ id: userId, admin: false })
        }
      )

    return () => {
      active = false
    }
  }, [userId])

  // Enquanto o papel do usuário logado não chega, a sessão conta como "carregando".
  const perfilPronto = !userId || perfil?.id === userId
  const isAdmin = !!userId && perfil?.id === userId && perfil.admin

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string, metadados: Record<string, string> = {}) {
    // Os metadados (nome e aceite da política) ficam guardados na conta; o perfil usa o nome até
    // a pessoa editá-lo. Valores vazios não são enviados.
    const data = Object.fromEntries(Object.entries(metadados).filter(([, v]) => v))
    const { error } = await supabase.auth.signUp({
      email,
      password,
      ...(Object.keys(data).length > 0 ? { options: { data } } : {}),
    })
    return { error: error?.message ?? null }
  }

  async function signInAnonimo(metadados: Record<string, string> = {}) {
    const { error } = await supabase.auth.signInAnonymously({ options: { data: metadados } })
    return { error: error?.message ?? null }
  }

  async function vincularConta(email: string, password: string, nome = '') {
    const { error } = await supabase.auth.updateUser({
      email,
      password,
      ...(nome ? { data: { nome } } : {}),
    })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading: loading || !perfilPronto,
        isAdmin,
        isAnonymous: !!session?.user.is_anonymous,
        signIn,
        signUp,
        signInAnonimo,
        vincularConta,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
