import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Denuncia, Linha } from '../types'

// O Supabase devolve no máximo 1000 linhas por consulta; busca página a página
// para não cortar as denúncias mais antigas sem avisar.
const TAMANHO_PAGINA = 1000

async function buscarTodasDenuncias(desde: string | null) {
  const todas: Denuncia[] = []
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    let consulta = supabase.from('denuncias').select('*, linha:linhas(*)')
    if (desde) consulta = consulta.gte('created_at', desde)
    const { data, error } = await consulta
      .order('created_at', { ascending: false })
      .order('id')
      .range(inicio, inicio + TAMANHO_PAGINA - 1)
    if (error) return { data: null, error }
    const pagina = (data ?? []) as Denuncia[]
    todas.push(...pagina)
    if (pagina.length < TAMANHO_PAGINA) break
  }
  return { data: todas, error: null }
}

/** Janela padrão de denúncias carregadas, para o app não ficar pesado com o tempo. */
export const DIAS_PADRAO = 30

/**
 * Carrega as denúncias dos últimos `dias` dias (padrão 30). Passe `null` para carregar
 * todo o histórico (usado no painel admin e em "minhas denúncias").
 */
export function useDenuncias(linhas: Linha[], dias: number | null = DIAS_PADRAO) {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const linhasPorId = useMemo(() => {
    const map = new Map<string, Linha>()
    for (const linha of linhas) map.set(linha.id, linha)
    return map
  }, [linhas])

  useEffect(() => {
    let active = true

    const desde =
      dias === null ? null : new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString()

    buscarTodasDenuncias(desde).then(({ data, error }) => {
      if (!active) return
      if (error || !data) {
        setError('Não foi possível carregar as denúncias. Verifique sua conexão.')
      } else {
        setDenuncias(data)
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [dias])

  useEffect(() => {
    const channel = supabase
      .channel('denuncias-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'denuncias' },
        (payload) => {
          const novaDenuncia = payload.new as Denuncia
          novaDenuncia.linha = linhasPorId.get(novaDenuncia.linha_id)
          setDenuncias((atual) => [novaDenuncia, ...atual])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'denuncias' },
        (payload) => {
          const atualizada = payload.new as Denuncia
          atualizada.linha = linhasPorId.get(atualizada.linha_id)
          setDenuncias((atual) =>
            atual.map((d) => (d.id === atualizada.id ? atualizada : d))
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'denuncias' },
        (payload) => {
          const removidaId = (payload.old as Denuncia).id
          setDenuncias((atual) => atual.filter((d) => d.id !== removidaId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [linhasPorId])

  return { denuncias, loading, error }
}
