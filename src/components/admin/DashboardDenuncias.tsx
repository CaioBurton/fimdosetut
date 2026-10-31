import { useMemo, useState, type ReactNode } from 'react'
import {
  calcularEstatisticas,
  filtrarDenuncias,
  FILTROS_INICIAIS,
  PERIODO_LABELS,
  type FiltrosDashboard,
  type Periodo,
} from '../../lib/dashboardDenuncias'
import {
  STATUS_LABELS,
  TIPO_LABELS,
  ZONA_COLORS,
  ZONA_LABELS,
  type Denuncia,
  type Linha,
  type StatusDenuncia,
  type TipoProblema,
  type Zona,
} from '../../types'

const ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'outras']

interface Props {
  denuncias: Denuncia[]
  linhas: Linha[]
  children: (filtradas: Denuncia[]) => ReactNode
}

function Kpi({ rotulo, valor, destaque }: { rotulo: string; valor: string | number; destaque?: string }) {
  return (
    <div className="card-brand p-3">
      <p className="text-xs font-bold uppercase text-brand-green-dark/70">{rotulo}</p>
      <p className="ttl text-3xl" style={destaque ? { color: destaque } : undefined}>
        {valor}
      </p>
    </div>
  )
}

function Barras({
  titulo,
  itens,
}: {
  titulo: string
  itens: { rotulo: string; total: number; cor: string }[]
}) {
  const max = Math.max(1, ...itens.map((i) => i.total))
  return (
    <div className="card-brand p-3.5">
      <h3 className="mb-2 text-sm font-bold text-brand-green-dark">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="text-sm text-brand-green-dark/60">Sem dados.</p>
      ) : (
        <ul className="space-y-1.5">
          {itens.map((i) => (
            <li key={i.rotulo} className="text-xs">
              <div className="flex justify-between gap-2 font-semibold">
                <span className="truncate">{i.rotulo}</span>
                <span>{i.total}</span>
              </div>
              <div className="h-2 bg-brand-cream">
                <div className="h-full" style={{ width: `${(i.total / max) * 100}%`, backgroundColor: i.cor }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DashboardDenuncias({ denuncias, linhas, children }: Props) {
  const [filtros, setFiltros] = useState<FiltrosDashboard>(FILTROS_INICIAIS)

  const filtradas = useMemo(() => filtrarDenuncias(denuncias, filtros), [denuncias, filtros])
  const stats = useMemo(() => calcularEstatisticas(filtradas), [filtradas])

  const filtrosAtivos = JSON.stringify(filtros) !== JSON.stringify(FILTROS_INICIAIS)

  function definir<K extends keyof FiltrosDashboard>(chave: K, valor: FiltrosDashboard[K]) {
    setFiltros((f) => ({ ...f, [chave]: valor }))
  }

  return (
    <div className="space-y-3">
      <section aria-label="Filtros" className="card-brand space-y-3 p-3.5">
        <input
          type="search"
          className="input-brand"
          placeholder="Buscar por descrição, linha ou nº do veículo"
          aria-label="Buscar denúncias"
          value={filtros.busca}
          onChange={(e) => definir('busca', e.target.value)}
        />

        <div className="sem-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Filtrar por zona">
          <button
            type="button"
            aria-pressed={filtros.zona === 'todas'}
            onClick={() => definir('zona', 'todas')}
            className={`chip-brand ${filtros.zona === 'todas' ? 'chip-brand-ativo' : ''}`}
          >
            Todas
          </button>
          {ZONAS.map((z) => (
            <button
              key={z}
              type="button"
              aria-pressed={filtros.zona === z}
              onClick={() => definir('zona', z)}
              className={`chip-brand ${filtros.zona === z ? 'chip-brand-ativo' : ''}`}
            >
              <i className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ZONA_COLORS[z] }} />
              {ZONA_LABELS[z]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            className="input-brand"
            aria-label="Status"
            value={filtros.status}
            onChange={(e) => definir('status', e.target.value as StatusDenuncia | 'todos')}
          >
            <option value="todos">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as StatusDenuncia[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            className="input-brand"
            aria-label="Tipo de problema"
            value={filtros.tipo}
            onChange={(e) => definir('tipo', e.target.value as TipoProblema | 'todos')}
          >
            <option value="todos">Todos os tipos</option>
            {(Object.keys(TIPO_LABELS) as TipoProblema[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            className="input-brand"
            aria-label="Período"
            value={filtros.periodo}
            onChange={(e) => definir('periodo', e.target.value as Periodo)}
          >
            {(Object.keys(PERIODO_LABELS) as Periodo[]).map((p) => (
              <option key={p} value={p}>
                {PERIODO_LABELS[p]}
              </option>
            ))}
          </select>
          <select
            className="input-brand"
            aria-label="Linha"
            value={filtros.linhaId}
            onChange={(e) => definir('linhaId', e.target.value)}
          >
            <option value="">Todas as linhas</option>
            {linhas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.codigo} - {l.nome}
              </option>
            ))}
          </select>
        </div>

        {filtrosAtivos && (
          <button
            type="button"
            className="text-sm font-bold text-brand-green underline"
            onClick={() => setFiltros(FILTROS_INICIAIS)}
          >
            Limpar filtros
          </button>
        )}
      </section>

      <section aria-label="Resumo" className="grid grid-cols-2 gap-2">
        <Kpi rotulo="Total" valor={stats.total} />
        <Kpi rotulo="Pendentes" valor={stats.pendentes} destaque="#c23838" />
        <Kpi rotulo="Resolvidas" valor={stats.resolvidas} />
        <Kpi rotulo="Taxa de resolução" valor={`${stats.taxaResolucao}%`} />
      </section>

      <Barras
        titulo="Por zona"
        itens={stats.porZona.map((i) => ({
          rotulo: ZONA_LABELS[i.chave],
          total: i.total,
          cor: ZONA_COLORS[i.chave],
        }))}
      />
      <Barras
        titulo="Por tipo de problema"
        itens={stats.porTipo.map((i) => ({ rotulo: TIPO_LABELS[i.chave], total: i.total, cor: '#084400' }))}
      />
      <Barras
        titulo="Linhas com mais denúncias"
        itens={stats.topLinhas.map((i) => ({ rotulo: i.rotulo, total: i.total, cor: '#307800' }))}
      />

      <h3 className="pt-1 text-sm font-bold text-brand-green-dark">
        {filtradas.length} {filtradas.length === 1 ? 'denúncia' : 'denúncias'}
      </h3>
      {children(filtradas)}
    </div>
  )
}
