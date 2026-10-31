import { useMemo } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { MapaDenuncias } from '../components/map/MapaDenuncias'
import { useDenuncias } from '../hooks/useDenuncias'
import { useLinhas } from '../hooks/useLinhas'

export function MapaPage() {
  const { linhas } = useLinhas()
  const { denuncias: todas, loading, error } = useDenuncias(linhas)

  const denuncias = useMemo(() => {
    const inicioDoDia = new Date()
    inicioDoDia.setHours(0, 0, 0, 0)
    return todas.filter((d) => new Date(d.created_at) >= inicioDoDia)
  }, [todas])

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
