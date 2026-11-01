import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Denuncia, Linha } from '../types'

// O Supabase devolve no máximo 1000 linhas por consulta; busca página a página
// para não cortar as denúncias mais antigas sem avisar.
const TAMANHO_PAGINA = 1000

async function buscarTodasDenuncias() {
  const todas: Denuncia[] = []
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await supabase
      .from('denuncias')
      .select('*, linha:linhas(*)')
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

export function useDenuncias(linhas: Linha[]) {
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

    buscarTodasDenuncias().then(({ data, error }) => {
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
  }, [])

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
