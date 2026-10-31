import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Papel, Perfil } from '../types'

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError('Não foi possível carregar os usuários.')
        else setUsuarios(data as Perfil[])
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const atualizar = useCallback(async (id: string, campos: Partial<Pick<Perfil, 'role' | 'banido'>>) => {
    const { error } = await supabase.from('profiles').update(campos).eq('id', id)
    if (error) return 'Não foi possível atualizar o usuário. Tente novamente.'
    setUsuarios((atual) => atual.map((u) => (u.id === id ? { ...u, ...campos } : u)))
    return null
  }, [])

  const alterarPapel = useCallback(
    (id: string, role: Papel) => atualizar(id, { role }),
    [atualizar]
  )

  const alterarBloqueio = useCallback(
    (id: string, banido: boolean) => atualizar(id, { banido }),
    [atualizar]
  )

  const excluir = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('admin_excluir_usuario', { alvo: id })
    if (error) return 'Não foi possível excluir o usuário. Tente novamente.'
    setUsuarios((atual) => atual.filter((u) => u.id !== id))
    return null
  }, [])

  return { usuarios, loading, error, alterarPapel, alterarBloqueio, excluir }
}
