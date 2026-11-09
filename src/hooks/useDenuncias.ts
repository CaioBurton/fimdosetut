import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { registrarLimpezaDeCache } from '../lib/cacheRegistro'
import { supabase } from '../lib/supabaseClient'
import type { Denuncia, Linha } from '../types'

// Só as colunas usadas pelo app (sem o join com `linhas`: as linhas já são carregadas à parte
// e anexadas no cliente), para gastar menos tráfego de saída do Supabase.
const COLUNAS =
  'id, linha_id, tipo, status, descricao, numero_veiculo, foto_path, latitude, longitude, created_at, updated_at, confirmacoes'

// O Supabase devolve no máximo 1000 linhas por consulta; busca página a página
// para não cortar as denúncias mais antigas sem avisar.
const TAMANHO_PAGINA = 1000

async function buscarTodasDenuncias(desde: string | null, ate: string | null, apenasMinhas: boolean) {
  const todas: Denuncia[] = []
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    // `minhas_denuncias` é uma visão do banco com só as denúncias de quem está logado: a autoria
    // não é pública, então o app não filtra por usuário no cliente.
    let consulta = supabase.from(apenasMinhas ? 'minhas_denuncias' : 'denuncias').select(COLUNAS)
    if (desde) consulta = consulta.gte('created_at', desde)
    if (ate) consulta = consulta.lt('created_at', ate)
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

/**
 * Janela padrão de denúncias carregadas. Quanto menor, menos dados saem do Supabase (egress) a
 * cada abertura do app; o histórico completo continua disponível no painel admin.
 */
export const DIAS_PADRAO = 14

/** Dia local `yyyy-mm-dd` de um instante ISO (o mesmo que `diaLocal` de `lib/dia`, sem importá-lo: ele importa este arquivo). */
function diaLocalDe(iso: string) {
  const data = new Date(iso)
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const d = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${d}`
}

/** Início do dia local `yyyy-mm-dd` (o mesmo valor do <input type="date">) e do dia seguinte, em ISO. */
export function janelaDoDia(dia: string) {
  const [ano, mes, d] = dia.split('-').map(Number)
  return {
    desde: new Date(ano, mes - 1, d).toISOString(),
    ate: new Date(ano, mes - 1, d + 1).toISOString(),
  }
}

// Cache em memória (vale enquanto a aba estiver aberta): trocar de página (Mapa ↔ Lista) reaproveita
// as denúncias já baixadas em vez de buscar tudo de novo. O tempo real mantém o cache atualizado
// enquanto uma página que usa o hook estiver aberta.
const VALIDADE_CACHE_MS = 2 * 60 * 1000
const cache = new Map<string, { dados: Denuncia[]; em: number }>()

/**
 * Esvazia o cache de denúncias. Usado nos testes e depois de criar uma denúncia: com a tela do formulário
 * aberta, nenhum hook está inscrito no tempo real, então o cache (mapa/lista) ficaria sem a nova.
 */
export function limparCacheDenuncias() {
  cache.clear()
}
registrarLimpezaDeCache(limparCacheDenuncias)

/**
 * Carrega as denúncias dos últimos `dias` dias (padrão 14). Passe `null` para carregar
 * todo o histórico (usado no painel admin e em "minhas denúncias"). Com `apenasMinhas`, busca só
 * as denúncias de quem está logado (visão `minhas_denuncias`); a autoria nunca vem na denúncia.
 *
 * Com `dia` (`yyyy-mm-dd`, dia local), busca SÓ as denúncias daquele dia e ignora `dias`: é o que o
 * mapa usa, para não baixar duas semanas de denúncias quando só mostra um dia. Trocar o `dia`
 * busca o novo dia (com `atualizando` ligado) sem perder os dados já na tela.
 */
export function useDenuncias(
  linhas: Linha[],
  dias: number | null = DIAS_PADRAO,
  apenasMinhas = false,
  dia?: string,
  // Falso: não busca nem assina o tempo real (ex.: aba do admin que não usa a lista de denúncias).
  ativo = true
) {
  // Denúncias sem a linha anexada: a linha é ligada abaixo, pelo `linha_id`, assim a lista
  // se completa sozinha quando as linhas terminam de carregar.
  // Nome do canal único por uso do hook: duas telas/componentes com o hook ao mesmo tempo (ex.: admin + gráfico
  // do painel) não podem dividir o mesmo canal, o Supabase recusa `.on` num canal já inscrito.
  const idCanal = useId()
  const chave = `${dia ? `dia:${dia}` : (dias ?? 'tudo')}|${apenasMinhas}`
  const emCache = cache.get(chave)
  const cacheValido = !!emCache && Date.now() - emCache.em < VALIDADE_CACHE_MS
  const [brutas, setBrutas] = useState<Denuncia[]>(cacheValido ? emCache.dados : [])
  // `loading`: ainda não chegou nenhum dado. `chaveDosDados`: de qual consulta é o que está na tela.
  const [loading, setLoading] = useState(!cacheValido)
  const [chaveDosDados, setChaveDosDados] = useState(cacheValido ? chave : '')
  const [error, setError] = useState<string | null>(null)

  // Aplica uma mudança à lista e ao cache, para o próximo uso do hook já vir atualizado.
  const aplicar = useCallback(
    (mudar: (atual: Denuncia[]) => Denuncia[]) => {
      setBrutas((atual) => {
        const novo = mudar(atual)
        const guardado = cache.get(chave)
        if (guardado) guardado.dados = novo
        return novo
      })
    },
    [chave]
  )

  const denuncias = useMemo(() => {
    const porId = new Map<string, Linha>()
    for (const linha of linhas) porId.set(linha.id, linha)
    return brutas.map((d) => ({ ...d, linha: porId.get(d.linha_id) }))
  }, [brutas, linhas])

  useEffect(() => {
    if (!ativo) return
    let active = true

    const guardado = cache.get(chave)
    if (guardado && Date.now() - guardado.em < VALIDADE_CACHE_MS) {
      setBrutas(guardado.dados)
      setChaveDosDados(chave)
      setError(null)
      setLoading(false)
      return
    }

    const janela = dia ? janelaDoDia(dia) : null
    const desde =
      janela?.desde ??
      (dias === null ? null : new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString())

    buscarTodasDenuncias(desde, janela?.ate ?? null, apenasMinhas).then(({ data, error }) => {
      if (!active) return
      if (error || !data) {
        setError('Não foi possível carregar as denúncias. Verifique sua conexão.')
        // Sem dados novos: ao trocar de dia, a tela não mostra o dia anterior como se fosse o atual.
        setBrutas([])
      } else {
        setError(null)
        cache.set(chave, { dados: data, em: Date.now() })
        setBrutas(data)
      }
      setChaveDosDados(chave)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [dias, dia, apenasMinhas, chave, ativo])

  useEffect(() => {
    if (!ativo) return
    const canal = supabase
      .channel(`${apenasMinhas ? 'minhas-denuncias-realtime' : 'denuncias-realtime'}-${idCanal}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'denuncias' },
        (payload) => {
          const atualizada = payload.new as Denuncia
          // Só troca as que já estão na lista (na visão "minhas", as dos outros são ignoradas).
          aplicar((atual) => atual.map((d) => (d.id === atualizada.id ? atualizada : d)))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'denuncias' },
        (payload) => {
          const removidaId = (payload.old as Denuncia).id
          aplicar((atual) => atual.filter((d) => d.id !== removidaId))
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
          // Vendo um dia específico, denúncia de outro dia não entra na lista.
          if (dia && diaLocalDe(nova.created_at) !== dia) return
          aplicar((atual) => (atual.some((d) => d.id === nova.id) ? atual : [nova, ...atual]))
        }
      )
    }

    canal.subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [apenasMinhas, aplicar, dia, idCanal, ativo])

  /** Atualiza campos de uma denúncia já carregada (ex.: o total de confirmações, sem esperar o tempo real). */
  const atualizarDenuncia = useCallback((id: string, campos: Partial<Denuncia>) => {
    aplicar((atual) => atual.map((d) => (d.id === id ? { ...d, ...campos } : d)))
  }, [aplicar])

  // Buscando outra consulta (ex.: outro dia) enquanto os dados da anterior ainda estão na tela.
  const atualizando = !loading && chaveDosDados !== chave

  return { denuncias, loading, atualizando, error, atualizarDenuncia }
}
