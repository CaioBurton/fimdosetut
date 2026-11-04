import { useEffect, useState } from 'react'
import { selosDaRpc, SELOS_VAZIOS, type DadosSelos } from '../lib/selos'
import { supabase } from '../lib/supabaseClient'

/** Números dos selos da própria pessoa (função `meus_selos`, que só enxerga as linhas dela). */
export function useSelos(userId: string | undefined) {
  const [dados, setDados] = useState<DadosSelos>(SELOS_VAZIOS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true

    supabase.rpc('meus_selos').then(
      ({ data, error }) => {
        if (!active) return
        if (error) setError('Não foi possível carregar seus selos.')
        else setDados(selosDaRpc(data))
        setLoading(false)
      },
      () => {
        if (!active) return
        setError('Não foi possível carregar seus selos.')
        setLoading(false)
      }
    )

    return () => {
      active = false
    }
  }, [userId])

  return { dados, loading, error }
}
