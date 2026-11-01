import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Linha, Zona } from '../types'

export interface DadosLinha {
  codigo: string
  nome: string
  zona: Zona
}

function ordenar(linhas: Linha[]) {
  return [...linhas].sort(
    (a, b) => a.zona.localeCompare(b.zona) || a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true })
  )
}

export function useLinhas() {
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    supabase
      .from('linhas')
      .select('*')
      .order('zona')
      .order('codigo')
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setError('Não foi possível carregar as linhas. Verifique sua conexão.')
        } else {
          setLinhas(data as Linha[])
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Ações de administração: retornam uma mensagem de erro ou null em caso de sucesso.
  const criar = useCallback(async (dados: DadosLinha) => {
    const { data, error } = await supabase.from('linhas').insert(dados).select().single()
    if (error || !data) return 'Não foi possível criar a linha. Tente novamente.'
    setLinhas((atual) => ordenar([...atual, data as Linha]))
    return null
  }, [])

  const atualizar = useCallback(async (id: string, dados: DadosLinha) => {
    const { error } = await supabase.from('linhas').update(dados).eq('id', id)
    if (error) return 'Não foi possível salvar a linha. Tente novamente.'
    setLinhas((atual) => ordenar(atual.map((l) => (l.id === id ? { ...l, ...dados } : l))))
    return null
  }, [])

  const excluir = useCallback(async (id: string) => {
    const { error } = await supabase.from('linhas').delete().eq('id', id)
    if (error) {
      return 'Não foi possível excluir a linha. Se ela tiver denúncias, não pode ser removida.'
    }
    setLinhas((atual) => atual.filter((l) => l.id !== id))
    return null
  }, [])

  return { linhas, loading, error, criar, atualizar, excluir }
}
