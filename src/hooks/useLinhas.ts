import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Linha } from '../types'

export function useLinhas() {
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    supabase
      .from('linhas')
      .select('*')
      .order('zona')
      .order('codigo')
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setError('Não foi possível carregar as linhas. Verifique sua conexão.')
        } else {
          setLinhas(data as Linha[])
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { linhas, loading, error }
}
