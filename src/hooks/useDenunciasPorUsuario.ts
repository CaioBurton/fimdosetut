import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Quantas denúncias cada usuário fez (só o admin enxerga todos). A autoria é privada, então
 * a contagem vem de uma função do banco, e não das denúncias públicas.
 */
export function useDenunciasPorUsuario() {
  const [totais, setTotais] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    let active = true

    supabase.rpc('denuncias_por_usuario').then(({ data, error }) => {
      if (!active || error || !data) return
      const mapa = new Map<string, number>()
      for (const linha of data as { user_id: string; total: number | string }[]) {
        mapa.set(linha.user_id, Number(linha.total))
      }
      setTotais(mapa)
    })

    return () => {
      active = false
    }
  }, [])

  return totais
}
