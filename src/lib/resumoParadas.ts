import type { TipoProblema } from '../types'

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
