import type { Denuncia, TipoProblema, Zona } from '../types'
import {
  calcularEstatisticas,
  contarPorDia,
  filtrarDenuncias,
  FILTROS_INICIAIS,
  type Periodo,
} from './dashboardDenuncias'

/** Quantidade de dias do gráfico "Por dia" (o último é hoje). */
export const DIAS_GRAFICO = 14

export interface ResumoPainel {
  total: number
  pendentes: number
  resolvidas: number
  /** Denúncias de hoje (último dia do gráfico), respeitando o filtro de zona. */
  hoje: number
  porZona: { chave: Zona; total: number }[]
  porTipo: { chave: TipoProblema; total: number }[]
  topLinhas: { linhaId: string; codigo: string; nome: string; total: number }[]
  porDia: { data: Date; total: number }[]
}

export const RESUMO_VAZIO: ResumoPainel = {
  total: 0,
  pendentes: 0,
  resolvidas: 0,
  hoje: 0,
  porZona: [],
  porTipo: [],
  topLinhas: [],
  porDia: [],
}

export function taxaResolucao(resumo: ResumoPainel) {
  return resumo.total === 0 ? 0 : Math.round((resumo.resolvidas / resumo.total) * 100)
}

/** Número de dias da janela de cada período (null = todo o histórico). */
export function diasDoPeriodo(periodo: Periodo): number | null {
  if (periodo === 'hoje') return 1
  if (periodo === '7d') return 7
  if (periodo === '30d') return 30
  return null
}

/** Calcula o resumo no navegador, a partir das denúncias já carregadas (usado no admin). */
export function resumirDenuncias(
  denuncias: Denuncia[],
  periodo: Periodo,
  zona: Zona | 'todas'
): ResumoPainel {
  const filtradas = filtrarDenuncias(denuncias, { ...FILTROS_INICIAIS, periodo, zona })
  const stats = calcularEstatisticas(filtradas)
  const porDia = contarPorDia(
    denuncias.filter((d) => zona === 'todas' || (d.linha?.zona ?? 'outras') === zona),
    DIAS_GRAFICO
  )

  return {
    total: stats.total,
    pendentes: stats.pendentes,
    resolvidas: stats.resolvidas,
    hoje: porDia[porDia.length - 1]?.total ?? 0,
    porZona: stats.porZona,
    porTipo: stats.porTipo,
    topLinhas: stats.topLinhas.map((l) => {
      const [codigo, ...resto] = l.rotulo.split(' - ')
      return {
        linhaId: l.linhaId,
        codigo: resto.length ? codigo : '—',
        nome: resto.length ? resto.join(' - ') : l.rotulo,
        total: l.total,
      }
    }),
    porDia: porDia.map((d) => ({ data: d.data, total: d.total })),
  }
}

interface RespostaRpc {
  total: number
  pendentes: number
  resolvidas: number
  porZona: { chave: Zona; total: number }[]
  porTipo: { chave: TipoProblema; total: number }[]
  topLinhas: { linhaId: string | null; codigo: string | null; nome: string | null; total: number }[]
  porDia: { dia: string; total: number }[]
}

/** Converte a resposta da função `painel_resumo` do banco no formato usado pela tela. */
export function resumoDaRpc(r: RespostaRpc): ResumoPainel {
  const porDia = (r.porDia ?? []).map((d) => ({
    // 'YYYY-MM-DD' vira meia-noite local, para o dia do mês bater com o do banco.
    data: new Date(`${d.dia}T00:00:00`),
    total: d.total,
  }))
  return {
    total: r.total ?? 0,
    pendentes: r.pendentes ?? 0,
    resolvidas: r.resolvidas ?? 0,
    hoje: porDia[porDia.length - 1]?.total ?? 0,
    porZona: r.porZona ?? [],
    porTipo: r.porTipo ?? [],
    topLinhas: (r.topLinhas ?? []).map((l) => ({
      linhaId: l.linhaId ?? '',
      codigo: l.codigo ?? '—',
      nome: l.nome ?? 'Linha removida',
      total: l.total,
    })),
    porDia,
  }
}
