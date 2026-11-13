import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Periodo } from '../lib/dashboardDenuncias'
import { diasDoPeriodo } from '../lib/resumoPainel'
import { PARADAS_VAZIO, paradasDaRpc, type ResumoParadas } from '../lib/resumoParadas'

/**
 * Resumo das denúncias de parada, calculado no banco (função `painel_paradas`). Segue o período do
 * painel, mantém o resumo anterior na tela enquanto o novo carrega e se atualiza em tempo real.
 */
export function usePainelParadas(periodo: Periodo) {
  const [resumo, setResumo] = useState<ResumoParadas>(PARADAS_VAZIO)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    function buscar(silencioso: boolean) {
      if (!silencioso) setLoading(true)
      supabase.rpc('painel_paradas', { dias: diasDoPeriodo(periodo) }).then(({ data, error }) => {
        if (!active) return
        if (error || !data) {
          if (!silencioso) setError('Não foi possível carregar as paradas.')
        } else {
          setError(null)
          setResumo(paradasDaRpc(data))
        }
        setLoading(false)
      })
    }

    buscar(false)

    const canal = supabase
      .channel(`painel-paradas-${periodo}`)
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
  }, [periodo])

  return { resumo, loading, error }
}
