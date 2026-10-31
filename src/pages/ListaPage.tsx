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
      <div className="space-y-3 p-4">
        <select
          value={filtroZona}
          aria-label="Filtrar por zona"
          onChange={(e) => setFiltroZona(e.target.value as Zona | 'todas')}
          className="w-full rounded-xl border border-brand-green/30 bg-white px-3 py-2.5 text-sm text-brand-green-dark"
        >
          <option value="todas">Todas as zonas</option>
          {ORDEM_ZONAS.map((zona) => (
            <option key={zona} value={zona}>
              {ZONA_LABELS[zona]}
            </option>
          ))}
        </select>

        {error && <p className="text-center text-sm text-zona-leste">{error}</p>}

        {loading && <p className="text-center text-brand-green-dark/60">Carregando...</p>}

        {!loading && !error && filtradas.length === 0 && (
          <p className="py-10 text-center text-brand-green-dark/60">
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
