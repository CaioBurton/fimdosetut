import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Periodo } from '../lib/dashboardDenuncias'
import {
  diasDoPeriodo,
  RESUMO_VAZIO,
  resumoDaRpc,
  type ResumoPainel,
} from '../lib/resumoPainel'
import type { Zona } from '../types'

/**
 * Busca o resumo do painel já calculado no banco (função `painel_resumo`), em vez de baixar
 * todas as denúncias. Mantém o resumo anterior na tela enquanto o novo carrega.
 */
export function usePainelResumo(periodo: Periodo, zona: Zona | 'todas') {
  const [resumo, setResumo] = useState<ResumoPainel>(RESUMO_VAZIO)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)

    supabase
      .rpc('painel_resumo', {
        dias: diasDoPeriodo(periodo),
        zona_filtro: zona === 'todas' ? null : zona,
      })
      .then(({ data, error }) => {
        if (!active) return
        if (error || !data) {
          setError('Não foi possível carregar o painel. Verifique sua conexão.')
        } else {
          setError(null)
          setResumo(resumoDaRpc(data))
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [periodo, zona])

  return { resumo, loading, error }
}
