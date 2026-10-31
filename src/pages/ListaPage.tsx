import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { DenunciaCard } from '../components/denuncia/DenunciaCard'
import { useDenuncias } from '../hooks/useDenuncias'
import { useLinhas } from '../hooks/useLinhas'
import { ZONA_LABELS, type Zona } from '../types'

const ORDEM_ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'outras']

export function ListaPage() {
  const { linhas } = useLinhas()
  const { denuncias, loading, error } = useDenuncias(linhas)
  const [filtroZona, setFiltroZona] = useState<Zona | 'todas'>('todas')

  const filtradas = denuncias.filter(
    (d) => filtroZona === 'todas' || d.linha?.zona === filtroZona
  )

  return (
    <AppLayout title="Denúncias">
      <section className="relative h-[170px] overflow-hidden border-b-[3px] border-brand-green bg-brand-green">
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
        <select
          value={filtroZona}
          aria-label="Filtrar por zona"
          onChange={(e) => setFiltroZona(e.target.value as Zona | 'todas')}
          className="input-brand !min-h-11 !text-sm"
        >
          <option value="todas">Todas as zonas</option>
          {ORDEM_ZONAS.map((zona) => (
            <option key={zona} value={zona}>
              {ZONA_LABELS[zona]}
            </option>
          ))}
        </select>

        {error && <p className="text-center text-sm text-zona-leste">{error}</p>}

        {loading && <p className="text-center text-brand-green-dark/70">Carregando...</p>}

        {!loading && !error && filtradas.length === 0 && (
          <p className="py-10 text-center text-brand-green-dark/70">
            Nenhuma denúncia encontrada.
          </p>
        )}

        {filtradas.map((denuncia) => (
          <DenunciaCard key={denuncia.id} denuncia={denuncia} />
        ))}
      </div>
    </AppLayout>
  )
}
