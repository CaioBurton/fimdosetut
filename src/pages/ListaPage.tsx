import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { LinhaSelect } from '../components/denuncia/LinhaSelect'
import { DenunciaCard } from '../components/denuncia/DenunciaCard'
import { DIAS_PADRAO, useDenuncias } from '../hooks/useDenuncias'
import { useLinhas } from '../hooks/useLinhas'
import { ZONA_COLORS, ZONA_LABELS, type Zona } from '../types'

const ORDEM_ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'outras']

// Data local no formato yyyy-mm-dd, o mesmo valor do <input type="date">.
function diaLocal(iso: string) {
  const data = new Date(iso)
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

const hoje = () => diaLocal(new Date().toISOString())
// A lista só carrega os últimos DIAS_PADRAO dias; datas anteriores ficariam sempre vazias.
const diaMinimo = () => diaLocal(new Date(Date.now() - DIAS_PADRAO * 24 * 60 * 60 * 1000).toISOString())

export function ListaPage() {
  const { linhas } = useLinhas()
  const { denuncias, loading, error } = useDenuncias(linhas)
  const [filtroZona, setFiltroZona] = useState<Zona | 'todas'>('todas')

  const [filtroLinha, setFiltroLinha] = useState('')
  const [filtroDia, setFiltroDia] = useState(hoje)

  const filtradas = denuncias.filter(
    (d) =>
      (filtroZona === 'todas' || (d.linha?.zona ?? 'outras') === filtroZona) &&
      (!filtroLinha || d.linha_id === filtroLinha) &&
      (!filtroDia || diaLocal(d.created_at) === filtroDia)
  )

  return (
    <AppLayout title="Denúncias">
      <section className="relative h-[170px] overflow-hidden border-b-[3px] border-brand-green bg-brand-green lg:border-[3px] lg:shadow-[4px_4px_0_#052d00]">
        <img
          src="/brand/onibus-bandeira.svg"
          alt=""
          aria-hidden="true"
          className="tom-sobre-tom absolute -bottom-3.5 -right-16 w-[330px] max-w-none"
        />
        <div className="relative flex flex-col gap-2 p-5 text-brand-cream">
          <h2 className="ttl text-4xl">Denúncias</h2>
          <p className="max-w-[220px] text-sm font-medium leading-snug">
            Ônibus quebrados avisados por quem usa o transporte todo dia.
          </p>
        </div>
      </section>
      <div className="space-y-4 p-4">
        <div className="sem-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filtrar por zona">
          <button
            type="button"
            onClick={() => setFiltroZona('todas')}
            aria-pressed={filtroZona === 'todas'}
            className={`chip-brand ${filtroZona === 'todas' ? 'chip-brand-ativo' : ''}`}
          >
            Todas
          </button>
          {ORDEM_ZONAS.map((zona) => (
            <button
              key={zona}
              type="button"
              onClick={() => setFiltroZona(zona)}
              aria-pressed={filtroZona === zona}
              className={`chip-brand ${filtroZona === zona ? 'chip-brand-ativo' : ''}`}
            >
              <i
                className="block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ZONA_COLORS[zona] }}
              />
              {ZONA_LABELS[zona]}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <LinhaSelect
              linhas={linhas}
              value={filtroLinha}
              onChange={setFiltroLinha}
              placeholder="Todas as linhas"
              listaLarga
            />
          </div>
          <div className="w-[9.5rem] shrink-0">
            <input
              type="date"
              min={diaMinimo()}
              max={hoje()}
              aria-label="Filtrar por dia"
              value={filtroDia}
              onChange={(e) => setFiltroDia(e.target.value)}
              className="input-brand min-w-0"
            />
          </div>
        </div>
        {(filtroLinha || filtroDia) && (
          <button
            type="button"
            className="text-sm font-bold text-brand-green underline"
            onClick={() => {
              setFiltroLinha('')
              setFiltroDia('')
            }}
          >
            Limpar filtros de linha e dia
          </button>
        )}

        {error && <p className="text-center text-sm text-zona-leste">{error}</p>}

        {loading && <p className="text-center text-brand-green-dark/70">Carregando...</p>}

        {!loading && !error && filtradas.length === 0 && (
          <p className="py-10 text-center text-brand-green-dark/70">
            Nenhuma denúncia encontrada.
          </p>
        )}

        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
          {filtradas.map((denuncia) => (
            <DenunciaCard key={denuncia.id} denuncia={denuncia} />
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
