import type { Denuncia, StatusDenuncia, TipoProblema, Zona } from '../types'

export type Periodo = 'todos' | 'hoje' | '7d' | '30d'

export interface FiltrosDashboard {
  zona: Zona | 'todas'
  tipo: TipoProblema | 'todos'
  status: StatusDenuncia | 'todos'
  periodo: Periodo
  linhaId: string
  busca: string
}

export const FILTROS_INICIAIS: FiltrosDashboard = {
  zona: 'todas',
  tipo: 'todos',
  status: 'todos',
  periodo: 'todos',
  linhaId: '',
  busca: '',
}

export const PERIODO_LABELS: Record<Periodo, string> = {
  todos: 'Todo o período',
  hoje: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
}

function inicioDoPeriodo(periodo: Periodo, agora: Date): Date | null {
  if (periodo === 'todos') return null
  const inicio = new Date(agora)
  inicio.setHours(0, 0, 0, 0)
  if (periodo === '7d') inicio.setDate(inicio.getDate() - 6)
  if (periodo === '30d') inicio.setDate(inicio.getDate() - 29)
  return inicio
}

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function filtrarDenuncias(
  denuncias: Denuncia[],
  filtros: FiltrosDashboard,
  agora: Date = new Date()
): Denuncia[] {
  const inicio = inicioDoPeriodo(filtros.periodo, agora)
  const busca = normalizar(filtros.busca.trim())

  return denuncias.filter((d) => {
    if (filtros.zona !== 'todas' && (d.linha?.zona ?? 'outras') !== filtros.zona) return false
    if (filtros.tipo !== 'todos' && d.tipo !== filtros.tipo) return false
    if (filtros.status !== 'todos' && d.status !== filtros.status) return false
    if (filtros.linhaId && d.linha_id !== filtros.linhaId) return false
    if (inicio && new Date(d.created_at) < inicio) return false
    if (busca) {
      const alvo = normalizar(
        [d.descricao, d.numero_veiculo ?? '', d.linha?.codigo ?? '', d.linha?.nome ?? ''].join(' ')
      )
      if (!alvo.includes(busca)) return false
    }
    return true
  })
}

export interface ItemContagem<T extends string> {
  chave: T
  total: number
}

function contar<T extends string>(chaves: T[]): ItemContagem<T>[] {
  const mapa = new Map<T, number>()
  for (const chave of chaves) mapa.set(chave, (mapa.get(chave) ?? 0) + 1)
  return [...mapa.entries()]
    .map(([chave, total]) => ({ chave, total }))
    .sort((a, b) => b.total - a.total)
}

export interface EstatisticasDashboard {
  total: number
  pendentes: number
  resolvidas: number
  taxaResolucao: number
  porZona: ItemContagem<Zona>[]
  porTipo: ItemContagem<TipoProblema>[]
  topLinhas: { linhaId: string; rotulo: string; total: number }[]
}

export function calcularEstatisticas(denuncias: Denuncia[]): EstatisticasDashboard {
  const total = denuncias.length
  const resolvidas = denuncias.filter((d) => d.status === 'resolvido').length

  const porLinha = new Map<string, { rotulo: string; total: number }>()
  for (const d of denuncias) {
    const rotulo = d.linha ? `${d.linha.codigo} - ${d.linha.nome}` : 'Linha removida'
    const atual = porLinha.get(d.linha_id)
    porLinha.set(d.linha_id, { rotulo, total: (atual?.total ?? 0) + 1 })
  }

  return {
    total,
    pendentes: total - resolvidas,
    resolvidas,
    taxaResolucao: total === 0 ? 0 : Math.round((resolvidas / total) * 100),
    porZona: contar(denuncias.map((d) => d.linha?.zona ?? 'outras')),
    porTipo: contar(denuncias.map((d) => d.tipo)),
    topLinhas: [...porLinha.entries()]
      .map(([linhaId, v]) => ({ linhaId, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
  }
}

export interface ContagemDia {
  data: Date
  total: number
}

/** Conta denúncias por dia nos últimos `dias` dias (o último item é hoje). */
export function contarPorDia(
  denuncias: Denuncia[],
  dias: number,
  agora: Date = new Date()
): ContagemDia[] {
  const inicioHoje = new Date(agora)
  inicioHoje.setHours(0, 0, 0, 0)

  const resultado: ContagemDia[] = []
  for (let i = dias - 1; i >= 0; i--) {
    const data = new Date(inicioHoje)
    data.setDate(data.getDate() - i)
    resultado.push({ data, total: 0 })
  }

  for (const d of denuncias) {
    const criada = new Date(d.created_at)
    criada.setHours(0, 0, 0, 0)
    const indice = resultado.findIndex((r) => r.data.getTime() === criada.getTime())
    if (indice >= 0) resultado[indice].total++
  }
  return resultado
}
