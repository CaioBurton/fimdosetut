import { useMemo, useState, type ReactNode } from 'react'
import {
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

export function DashboardDenuncias({ denuncias, linhas, children }: Props) {
  const [filtros, setFiltros] = useState<FiltrosDashboard>(FILTROS_INICIAIS)

  const filtradas = useMemo(() => filtrarDenuncias(denuncias, filtros), [denuncias, filtros])

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

      <h3 className="pt-1 text-sm font-bold text-brand-green-dark">
        {filtradas.length} {filtradas.length === 1 ? 'denúncia' : 'denúncias'}
      </h3>
      {children(filtradas)}
    </div>
  )
}
