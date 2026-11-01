import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Feedback } from '../types'

const LIMITE = 200

/** Feedbacks recebidos (só o admin consegue ler), do mais novo para o mais antigo. */
export function useFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    supabase
      .from('feedbacks')
      .select('id, user_id, tipo, mensagem, created_at, perfil:profiles(email)')
      .order('created_at', { ascending: false })
      .limit(LIMITE)
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError('Não foi possível carregar os feedbacks.')
        else setFeedbacks(data as unknown as Feedback[])
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const excluir = useCallback(async (id: string) => {
    const { error } = await supabase.from('feedbacks').delete().eq('id', id)
    if (error) return 'Não foi possível excluir o feedback. Tente novamente.'
    setFeedbacks((atual) => atual.filter((f) => f.id !== id))
    return null
  }, [])

  return { feedbacks, loading, error, excluir }
}
