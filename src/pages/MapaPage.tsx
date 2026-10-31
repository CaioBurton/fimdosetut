import { AppLayout } from '../components/layout/AppLayout'
import { MapaDenuncias } from '../components/map/MapaDenuncias'
import { useDenuncias } from '../hooks/useDenuncias'
import { useLinhas } from '../hooks/useLinhas'

export function MapaPage() {
  const { linhas } = useLinhas()
  const { denuncias, loading, error } = useDenuncias(linhas)

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
        <MapaDenuncias denuncias={denuncias} />
      )}
    </AppLayout>
  )
}
