import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Denuncia, Linha } from '../types'

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

    supabase
      .from('denuncias')
      .select('*, linha:linhas(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setError('Não foi possível carregar as denúncias. Verifique sua conexão.')
        } else {
          setDenuncias(data as Denuncia[])
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
