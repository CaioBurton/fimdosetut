import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { MapaDenuncias, tempoRelativo } from '../components/map/MapaDenuncias'
import { useDenuncias } from '../hooks/useDenuncias'
import { useDesktop } from '../hooks/useDesktop'
import { useLinhas } from '../hooks/useLinhas'
import { STATUS_LABELS, TIPO_LABELS, ZONA_COLORS, ZONA_LABELS, type Denuncia, type Zona } from '../types'

const ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'outras']

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function MapaPage() {
  const desktop = useDesktop()
  const { linhas } = useLinhas()
  const { denuncias: todas, loading, error } = useDenuncias(linhas)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<Denuncia['status'] | 'todas'>('todas')

  const denuncias = useMemo(() => {
    const inicioDoDia = new Date()
    inicioDoDia.setHours(0, 0, 0, 0)
    return todas.filter((d) => new Date(d.created_at) >= inicioDoDia)
  }, [todas])

  // No desktop, a busca por linha e o filtro de status ficam sobre o mapa.
  const visiveis = useMemo(() => {
    if (!desktop) return denuncias
    const termo = normalizar(busca.trim())
    return denuncias.filter(
      (d) =>
        (status === 'todas' || d.status === status) &&
        (!termo || normalizar(`${d.linha?.codigo ?? ''} ${d.linha?.nome ?? ''}`).includes(termo))
    )
  }, [denuncias, desktop, busca, status])

  return (
    <AppLayout title="Deu o Prego!" noScroll>
      {error && (
        <div className="absolute top-16 z-20 w-full bg-zona-leste px-4 py-2 text-center text-sm text-white">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex h-full items-center justify-center text-brand-green-dark">
          Carregando mapa...
        </div>
      ) : (
        <div className="flex h-full">
          <div className="relative min-w-0 flex-1">
            <MapaDenuncias denuncias={visiveis} semFiltroZona={desktop} />
            {desktop && (
              <>
                <div className="absolute left-6 right-6 top-6 z-[500] flex flex-wrap items-center gap-3">
                  <div className="card-brand relative max-w-[360px] flex-[1_1_260px] !shadow-[3px_3px_0_#084400]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="pointer-events-none absolute left-3 top-[13px]" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-4-4" />
                    </svg>
                    <input
                      type="search"
                      aria-label="Filtrar por linha"
                      placeholder="Filtrar por linha"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="min-h-[46px] w-full bg-transparent pl-10 pr-3 text-base text-brand-green-dark outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2" aria-label="Filtrar por status">
                    {([
                      ['todas', 'Todas'],
                      ['pendente', 'Pendentes'],
                      ['resolvido', 'Resolvidas'],
                    ] as const).map(([valor, rotulo]) => (
                      <button
                        key={valor}
                        type="button"
                        aria-pressed={status === valor}
                        onClick={() => setStatus(valor)}
                        className={`chip-brand !min-h-10 ${status === valor ? 'chip-brand-ativo' : ''}`}
                      >
                        {rotulo}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="card-brand absolute bottom-6 left-6 z-[500] flex flex-wrap gap-3.5 px-4 py-3 text-[13px] font-bold">
                  {ZONAS.map((z) => (
                    <span key={z} className="flex items-center gap-1.5 text-[#2f5a28]">
                      <i className="block h-3 w-3 rounded-full" style={{ backgroundColor: ZONA_COLORS[z] }} />
                      {ZONA_LABELS[z]}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          {desktop && (
            <aside
              aria-label="Denúncias recentes"
              className="flex w-[380px] shrink-0 flex-col gap-4 overflow-y-auto border-l-[3px] border-brand-green bg-brand-cream p-6"
            >
              <div>
                <h2 className="ttl text-[32px] leading-[0.95]">Denúncias recentes</h2>
                <p className="mt-1.5 text-sm font-medium text-[#2f5a28]">Atualiza em tempo real</p>
              </div>
              {visiveis.length === 0 && (
                <p className="py-6 text-center text-brand-green-dark/70">Nenhuma denúncia hoje.</p>
              )}
              {visiveis.map((d) => {
                const zona = d.linha?.zona ?? 'outras'
                return (
                  <article key={d.id} className="card-brand flex items-center gap-2.5 p-3 !shadow-[3px_3px_0_#084400]">
                    <span className="ttl bg-brand-green px-2 py-1.5 text-[15px] leading-none text-brand-cream">
                      {d.linha?.codigo ?? '—'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold leading-tight">{TIPO_LABELS[d.tipo]}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-[#2f5a28]">
                        <i className="block h-[9px] w-[9px] rounded-full" style={{ backgroundColor: ZONA_COLORS[zona] }} />
                        Zona {ZONA_LABELS[zona]} · {tempoRelativo(d.created_at)}
                      </p>
                    </div>
                    <span className="rounded-[2px] border-2 border-brand-green px-2 py-1 text-xs font-bold">
                      {STATUS_LABELS[d.status]}
                    </span>
                  </article>
                )
              })}
              <Link to="/denuncias" className="text-sm font-bold underline">
                Ver todas →
              </Link>
            </aside>
          )}
        </div>
      )}
    </AppLayout>
  )
}
