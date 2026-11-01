import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Denuncia, Linha } from '../types'

// Só as colunas usadas pelo app (sem o join com `linhas`: as linhas já são carregadas à parte
// e anexadas no cliente), para gastar menos tráfego de saída do Supabase.
const COLUNAS =
  'id, user_id, linha_id, tipo, status, descricao, numero_veiculo, latitude, longitude, created_at, updated_at'

// O Supabase devolve no máximo 1000 linhas por consulta; busca página a página
// para não cortar as denúncias mais antigas sem avisar.
const TAMANHO_PAGINA = 1000

async function buscarTodasDenuncias(desde: string | null, userId?: string) {
  const todas: Denuncia[] = []
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    let consulta = supabase.from('denuncias').select(COLUNAS)
    if (userId) consulta = consulta.eq('user_id', userId)
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
 * todo o histórico (usado no painel admin e em "minhas denúncias"). Com `userId`, busca (e
 * escuta em tempo real) só as denúncias desse usuário.
 */
export function useDenuncias(
  linhas: Linha[],
  dias: number | null = DIAS_PADRAO,
  userId?: string
) {
  // Denúncias sem a linha anexada: a linha é ligada abaixo, pelo `linha_id`, assim a lista
  // se completa sozinha quando as linhas terminam de carregar.
  const [brutas, setBrutas] = useState<Denuncia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const denuncias = useMemo(() => {
    const porId = new Map<string, Linha>()
    for (const linha of linhas) porId.set(linha.id, linha)
    return brutas.map((d) => ({ ...d, linha: porId.get(d.linha_id) }))
  }, [brutas, linhas])

  useEffect(() => {
    let active = true

    const desde =
      dias === null ? null : new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString()

    buscarTodasDenuncias(desde, userId).then(({ data, error }) => {
      if (!active) return
      if (error || !data) {
        setError('Não foi possível carregar as denúncias. Verifique sua conexão.')
      } else {
        setBrutas(data)
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [dias, userId])

  useEffect(() => {
    const filtro = userId ? { filter: `user_id=eq.${userId}` } : {}
    const channel = supabase
      .channel(userId ? `denuncias-realtime-${userId}` : 'denuncias-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'denuncias', ...filtro },
        (payload) => {
          const nova = payload.new as Denuncia
          setBrutas((atual) => [nova, ...atual])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'denuncias', ...filtro },
        (payload) => {
          const atualizada = payload.new as Denuncia
          setBrutas((atual) => atual.map((d) => (d.id === atualizada.id ? atualizada : d)))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'denuncias' },
        (payload) => {
          const removidaId = (payload.old as Denuncia).id
          setBrutas((atual) => atual.filter((d) => d.id !== removidaId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { denuncias, loading, error }
}
