import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { aprovarFoto, recusarFoto } from '../lib/fotosDenuncias'
import { supabase } from '../lib/supabaseClient'
import type { TipoProblema } from '../types'

/** Quantas fotos a lista mostra de uma vez (o contador usa o total real). */
const LIMITE_LISTA = 100

export interface FotoPendente {
  denuncia_id: string
  foto_path: string
  created_at: string
  denuncia: {
    tipo: TipoProblema
    descricao: string
    created_at: string
    local_tipo: 'onibus' | 'parada'
    referencia_parada: string | null
    linha: { codigo: string; nome: string } | null
  } | null
}

/**
 * Fila de fotos esperando aprovação (só o admin lê a fila toda), da mais antiga para a mais nova.
 * `total` é o tamanho real da fila (a lista traz no máximo 100) e acompanha o tempo real: foto nova
 * na fila ou aprovada/recusada por outro admin atualiza a tela.
 * Com `ativo` falso não busca nada (quem já recebeu a fila de fora, para não baixar duas vezes).
 */
export function useFotosPendentes(ativo = true) {
  const idCanal = useId()
  const [fotos, setFotos] = useState<FotoPendente[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(ativo)
  const [error, setError] = useState<string | null>(null)
  // Espelho da lista para os eventos do tempo real decidirem sem depender de render. `tratadas`: fotos
  // que esta própria tela já tirou da lista (o evento de DELETE delas não precisa baixar nada de novo).
  const fotosRef = useRef<FotoPendente[]>([])
  const totalRef = useRef(0)
  const tratadas = useRef(new Set<string>())

  const carregar = useCallback(async () => {
    const { data, error, count } = await supabase
      .from('fotos_pendentes')
      .select(
        'denuncia_id, foto_path, created_at, denuncia:denuncias(tipo, local_tipo, referencia_parada, descricao, created_at, linha:linhas(codigo, nome))',
        { count: 'exact' }
      )
      .order('created_at', { ascending: true })
      .limit(LIMITE_LISTA)
    if (error) {
      setError('Não foi possível carregar as fotos para análise.')
    } else {
      const lista = (data ?? []) as unknown as FotoPendente[]
      setError(null)
      fotosRef.current = lista
      tratadas.current.clear()
      setFotos(lista)
      totalRef.current = count ?? lista.length
      setTotal(totalRef.current)
    }
    setLoading(false)
  }, [])

  /** Tira a foto da lista e do contador. Devolve se ela estava na lista (para não contar duas vezes). */
  const remover = useCallback((id: string) => {
    if (!fotosRef.current.some((f) => f.denuncia_id === id)) return false
    fotosRef.current = fotosRef.current.filter((f) => f.denuncia_id !== id)
    setFotos(fotosRef.current)
    totalRef.current = Math.max(0, totalRef.current - 1)
    setTotal(totalRef.current)
    return true
  }, [])

  useEffect(() => {
    if (!ativo) return
    let active = true
    void carregar()
    // Tempo real, sem baixar a fila toda a cada evento:
    // - foto nova (INSERT): busca de novo, porque o evento não traz a denúncia ligada;
    // - foto que saiu (DELETE): se estava na lista, só tira; se foi esta tela que a tirou, ignora; só
    //   busca de novo quando era uma foto fora da lista (fila com mais de 100).
    const canal = supabase
      .channel(`fotos-pendentes-${idCanal}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fotos_pendentes' }, () => {
        if (active) void carregar()
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'fotos_pendentes' }, (payload) => {
        if (!active) return
        const id = (payload.old as { denuncia_id?: string }).denuncia_id
        if (!id) return void carregar()
        if (tratadas.current.delete(id)) return
        if (!remover(id)) void carregar()
      })
      .subscribe()
    return () => {
      active = false
      supabase.removeChannel(canal)
    }
  }, [ativo, carregar, idCanal, remover])

  // Depois de aprovar/recusar aqui: a tela já atualiza sozinha. Só busca de novo se a fila é maior que
  // a lista (mais de 100), para puxar as fotos seguintes.
  const depoisDeAcao = useCallback(
    (id: string) => {
      if (remover(id)) tratadas.current.add(id)
      if (totalRef.current > fotosRef.current.length) void carregar()
    },
    [remover, carregar]
  )

  const aprovar = useCallback(
    async (id: string) => {
      const { error } = await aprovarFoto(id)
      if (error) return 'Não foi possível aprovar a foto. Tente novamente.'
      depoisDeAcao(id)
      return null
    },
    [depoisDeAcao]
  )

  const recusar = useCallback(
    async (id: string) => {
      const { error } = await recusarFoto(id)
      if (error) return 'Não foi possível recusar a foto. Tente novamente.'
      depoisDeAcao(id)
      return null
    },
    [depoisDeAcao]
  )

  return { fotos, total, loading, error, aprovar, recusar }
}
