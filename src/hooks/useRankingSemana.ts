import { useEffect, useState } from 'react'
import { rankingDaRpc, type LinhaEmAlta } from '../lib/rankingSemana'
import { supabase } from '../lib/supabaseClient'

/** Ranking público de linhas dos últimos 7 dias (função `ranking_linhas_semana`). */
export function useRankingSemana(limite = 3) {
  const [linhas, setLinhas] = useState<LinhaEmAlta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true

    supabase.rpc('ranking_linhas_semana', { p_limite: limite }).then(
      ({ data, error }) => {
        if (!active) return
        if (error) setError(true)
        else setLinhas(rankingDaRpc(data))
        setLoading(false)
      },
      () => {
        if (!active) return
        setError(true)
        setLoading(false)
      }
    )

    return () => {
      active = false
    }
  }, [limite])

  return { linhas, loading, error }
}
