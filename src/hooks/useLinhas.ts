import { useCallback, useEffect, useState } from 'react'
import { registrarLimpezaDeCache } from '../lib/cacheRegistro'
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

// As linhas quase nunca mudam: ficam em memória enquanto a aba estiver aberta, para cada página
// (e o aviso de alertas, presente em todas) não buscá-las de novo. Qualquer edição de admin invalida.
let cacheLinhas: Linha[] | null = null
// Busca em andamento: vários componentes montam `useLinhas` ao mesmo tempo (alertas + página); todos
// esperam a mesma consulta em vez de cada um baixar a tabela.
let buscaEmAndamento: Promise<{ data: Linha[] | null; error: boolean }> | null = null

function buscarLinhas() {
  buscaEmAndamento ??= Promise.resolve(
    supabase.from('linhas').select('id, codigo, nome, zona').order('zona').order('codigo')
  )
    .then(({ data, error }) => ({ data: error ? null : (data as Linha[]), error: !!error }))
    .catch(() => ({ data: null, error: true }))
    .finally(() => {
      buscaEmAndamento = null
    })
  return buscaEmAndamento
}

/** Esvazia o cache de linhas (usado nos testes). */
export function limparCacheLinhas() {
  cacheLinhas = null
  buscaEmAndamento = null
}
registrarLimpezaDeCache(limparCacheLinhas)

export function useLinhas() {
  const [linhas, setLinhas] = useState<Linha[]>(cacheLinhas ?? [])
  const [loading, setLoading] = useState(cacheLinhas === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (cacheLinhas) return

    buscarLinhas().then(({ data, error }) => {
      if (!active) return
      if (error || !data) {
        setError('Não foi possível carregar as linhas. Verifique sua conexão.')
      } else {
        cacheLinhas = data
        setLinhas(data)
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
    cacheLinhas = null
    setLinhas((atual) => ordenar([...atual, data as Linha]))
    return null
  }, [])

  const atualizar = useCallback(async (id: string, dados: DadosLinha) => {
    const { error } = await supabase.from('linhas').update(dados).eq('id', id)
    if (error) return 'Não foi possível salvar a linha. Tente novamente.'
    cacheLinhas = null
    setLinhas((atual) => ordenar(atual.map((l) => (l.id === id ? { ...l, ...dados } : l))))
    return null
  }, [])

  const excluir = useCallback(async (id: string) => {
    const { error } = await supabase.from('linhas').delete().eq('id', id)
    if (error) {
      return 'Não foi possível excluir a linha. Se ela tiver denúncias, não pode ser removida.'
    }
    cacheLinhas = null
    setLinhas((atual) => atual.filter((l) => l.id !== id))
    return null
  }, [])

  return { linhas, loading, error, criar, atualizar, excluir }
}
