import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Nome dos usuários indicados em `ids` (só quem preencheu o nome). Só o admin consegue: a função do banco
 * recusa os demais, e devolve apenas o nome, sem bairro nem locais de trabalho e estudo.
 * Pede ao banco só os ids que ainda não foram consultados, para não baixar o nome de todo mundo.
 */
export function useNomesUsuarios(ids: string[]) {
  const [nomes, setNomes] = useState<Map<string, string>>(new Map())
  const consultados = useRef(new Set<string>())
  const montado = useRef(true)
  const chave = useMemo(() => [...ids].sort().join(','), [ids])

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  useEffect(() => {
    const faltam = chave ? chave.split(',').filter((id) => !consultados.current.has(id)) : []
    if (faltam.length === 0) return
    for (const id of faltam) consultados.current.add(id)

    supabase.rpc('nomes_por_usuario', { ids: faltam }).then(({ data, error }) => {
      if (error || !data) {
        // Deixa tentar de novo na próxima vez.
        for (const id of faltam) consultados.current.delete(id)
        return
      }
      if (!montado.current) return
      setNomes((antes) => {
        const mapa = new Map(antes)
        for (const linha of data as { user_id: string; nome: string }[]) {
          mapa.set(linha.user_id, linha.nome)
        }
        return mapa
      })
    })
  }, [chave])

  return nomes
}
