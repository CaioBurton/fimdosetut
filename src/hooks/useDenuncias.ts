import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Denuncia, Linha } from '../types'

// Só as colunas usadas pelo app (sem o join com `linhas`: as linhas já são carregadas à parte
// e anexadas no cliente), para gastar menos tráfego de saída do Supabase.
const COLUNAS =
  'id, linha_id, tipo, status, descricao, numero_veiculo, latitude, longitude, created_at, updated_at, confirmacoes'

// O Supabase devolve no máximo 1000 linhas por consulta; busca página a página
// para não cortar as denúncias mais antigas sem avisar.
const TAMANHO_PAGINA = 1000

async function buscarTodasDenuncias(desde: string | null, apenasMinhas: boolean) {
  const todas: Denuncia[] = []
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    // `minhas_denuncias` é uma visão do banco com só as denúncias de quem está logado: a autoria
    // não é pública, então o app não filtra por usuário no cliente.
    let consulta = supabase.from(apenasMinhas ? 'minhas_denuncias' : 'denuncias').select(COLUNAS)
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
 * todo o histórico (usado no painel admin e em "minhas denúncias"). Com `apenasMinhas`, busca só
 * as denúncias de quem está logado (visão `minhas_denuncias`); a autoria nunca vem na denúncia.
 */
export function useDenuncias(
  linhas: Linha[],
  dias: number | null = DIAS_PADRAO,
  apenasMinhas = false
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

    buscarTodasDenuncias(desde, apenasMinhas).then(({ data, error }) => {
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
  }, [dias, apenasMinhas])

  useEffect(() => {
    const canal = supabase
      .channel(apenasMinhas ? 'minhas-denuncias-realtime' : 'denuncias-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'denuncias' },
        (payload) => {
          const atualizada = payload.new as Denuncia
          // Só troca as que já estão na lista (na visão "minhas", as dos outros são ignoradas).
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

    // Denúncia nova: não dá para saber de quem é (a autoria é privada), então só a lista
    // geral recebe novas em tempo real. "Minhas" já inclui as próprias ao abrir a página.
    if (!apenasMinhas) {
      canal.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'denuncias' },
        (payload) => {
          const nova = payload.new as Denuncia
          setBrutas((atual) => [nova, ...atual])
        }
      )
    }

    canal.subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [apenasMinhas])

  /** Atualiza campos de uma denúncia já carregada (ex.: o total de confirmações, sem esperar o tempo real). */
  const atualizarDenuncia = useCallback((id: string, campos: Partial<Denuncia>) => {
    setBrutas((atual) => atual.map((d) => (d.id === id ? { ...d, ...campos } : d)))
  }, [])

  return { denuncias, loading, error, atualizarDenuncia }
}
