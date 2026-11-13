import type { Denuncia, TipoProblema } from '../types'

/** Resumo das denúncias de parada no período (vem da função `painel_paradas` do banco). */
export interface ResumoParadas {
  total: number
  pendentes: number
  resolvidas: number
  /** Problemas mais citados, do mais para o menos frequente. */
  porTipo: { chave: TipoProblema; total: number }[]
}

export const PARADAS_VAZIO: ResumoParadas = { total: 0, pendentes: 0, resolvidas: 0, porTipo: [] }

interface RespostaRpc {
  total?: number
  pendentes?: number
  resolvidas?: number
  porTipo?: { chave: TipoProblema; total: number }[]
}

/** Converte a resposta da função `painel_paradas` no formato usado pela tela. */
export function paradasDaRpc(r: RespostaRpc): ResumoParadas {
  return {
    total: r.total ?? 0,
    pendentes: r.pendentes ?? 0,
    resolvidas: r.resolvidas ?? 0,
    porTipo: (r.porTipo ?? []).filter((t) => t.chave.startsWith('parada_')),
  }
}

/** Calcula o resumo no navegador, a partir de denúncias já carregadas (usado nos cartões do dia). */
export function resumirParadas(denuncias: Denuncia[]): ResumoParadas {
  const paradas = denuncias.filter((d) => d.local_tipo === 'parada')
  const porTipo = new Map<TipoProblema, number>()
  for (const d of paradas) porTipo.set(d.tipo, (porTipo.get(d.tipo) ?? 0) + 1)
  const resolvidas = paradas.filter((d) => d.status === 'resolvido').length
  return {
    total: paradas.length,
    pendentes: paradas.length - resolvidas,
    resolvidas,
    porTipo: [...porTipo.entries()]
      .map(([chave, total]) => ({ chave, total }))
      .sort((a, b) => b.total - a.total),
  }
}
