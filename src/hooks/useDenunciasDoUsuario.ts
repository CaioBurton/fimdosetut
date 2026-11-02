import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Ids das denúncias feitas por um usuário (só o admin enxerga a autoria dos outros: a leitura de
 * `denuncia_autores` é limitada ao dono e ao admin). `null` enquanto carrega.
 */
export function useDenunciasDoUsuario(userId: string) {
  const [ids, setIds] = useState<Set<string> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIds(null)
    setError(null)

    supabase
      .from('denuncia_autores')
      .select('denuncia_id')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (!active) return
        if (error || !data) setError('Não foi possível carregar as denúncias deste usuário.')
        else setIds(new Set((data as { denuncia_id: string }[]).map((r) => r.denuncia_id)))
      })

    return () => {
      active = false
    }
  }, [userId])

  return { ids, error }
}
