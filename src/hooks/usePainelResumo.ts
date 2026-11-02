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
 * todas as denúncias. Mantém o resumo anterior na tela enquanto o novo carrega e o atualiza em tempo real.
 */
export function usePainelResumo(periodo: Periodo, zona: Zona | 'todas') {
  const [resumo, setResumo] = useState<ResumoPainel>(RESUMO_VAZIO)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    // `silencioso`: atualização por tempo real, sem escurecer o painel nem mostrar erro por um tropeço.
    function buscar(silencioso: boolean) {
      if (!silencioso) setLoading(true)
      supabase
        .rpc('painel_resumo', {
          dias: diasDoPeriodo(periodo),
          zona_filtro: zona === 'todas' ? null : zona,
        })
        .then(({ data, error }) => {
          if (!active) return
          if (error || !data) {
            if (!silencioso) setError('Não foi possível carregar o painel. Verifique sua conexão.')
          } else {
            setError(null)
            setResumo(resumoDaRpc(data))
          }
          setLoading(false)
        })
    }

    buscar(false)

    // Qualquer denúncia criada, alterada (status, "Também vi") ou apagada refaz o resumo.
    // Várias mudanças seguidas viram uma só busca.
    const canal = supabase
      .channel(`painel-resumo-${periodo}-${zona}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'denuncias' }, () => {
        clearTimeout(timer)
        timer = setTimeout(() => buscar(true), 800)
      })
      .subscribe()

    return () => {
      active = false
      clearTimeout(timer)
      supabase.removeChannel(canal)
    }
  }, [periodo, zona])

  return { resumo, loading, error }
}
