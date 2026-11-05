import type { Zona } from '../types'

/** Uma linha do ranking semanal. Só totais: quem denunciou nunca aparece. */
export interface LinhaEmAlta {
  linhaId: string
  codigo: string
  nome: string
  zona: Zona
  denuncias: number
  /** Pessoas diferentes que denunciaram a linha (a linha só entra com 2 ou mais). */
  pessoas: number
  confirmacoes: number
  pendentes: number
}

const ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'timon', 'rural', 'outras']
const numero = (valor: unknown) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : 0)

/** Converte a resposta da função `ranking_linhas_semana` (nunca confia no formato). */
export function rankingDaRpc(bruto: unknown): LinhaEmAlta[] {
  if (!Array.isArray(bruto)) return []
  return bruto.flatMap((l) => {
    if (!l || typeof l !== 'object') return []
    const { linha_id, codigo, nome, zona, denuncias, pessoas, confirmacoes, pendentes } = l as Record<string, unknown>
    if (typeof codigo !== 'string') return []
    return [
      {
        linhaId: String(linha_id ?? codigo),
        codigo,
        nome: typeof nome === 'string' ? nome : '',
        zona: ZONAS.includes(zona as Zona) ? (zona as Zona) : 'outras',
        denuncias: numero(denuncias),
        pessoas: numero(pessoas),
        confirmacoes: numero(confirmacoes),
        pendentes: numero(pendentes),
      },
    ]
  })
}
