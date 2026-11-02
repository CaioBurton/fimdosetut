import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Nome de cada usuário que preencheu o perfil (só o admin consegue: a função do banco recusa os demais,
 * e devolve apenas o nome, sem bairro nem locais de trabalho e estudo).
 */
export function useNomesUsuarios() {
  const [nomes, setNomes] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    let active = true

    supabase.rpc('nomes_por_usuario').then(({ data, error }) => {
      if (!active || error || !data) return
      const mapa = new Map<string, string>()
      for (const linha of data as { user_id: string; nome: string }[]) {
        mapa.set(linha.user_id, linha.nome)
      }
      setNomes(mapa)
    })

    return () => {
      active = false
    }
  }, [])

  return nomes
}
