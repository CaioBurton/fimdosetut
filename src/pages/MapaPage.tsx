import { useMemo } from 'react'
import { DenunciaCard } from '../components/denuncia/DenunciaCard'
import { useDesktop } from '../hooks/useDesktop'
import { AppLayout } from '../components/layout/AppLayout'
import { MapaDenuncias } from '../components/map/MapaDenuncias'
import { useDenuncias } from '../hooks/useDenuncias'
import { useLinhas } from '../hooks/useLinhas'

export function MapaPage() {
  const desktop = useDesktop()
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
        <div className="flex h-full">
          <div className="min-w-0 flex-1">
            <MapaDenuncias denuncias={denuncias} />
          </div>
          {desktop && (
            <aside
              aria-label="Denúncias de hoje"
              className="w-[360px] shrink-0 space-y-3 overflow-y-auto border-l-[3px] border-brand-green bg-brand-cream p-5"
            >
              <h2 className="ttl text-3xl">Hoje</h2>
              <p className="text-sm font-medium text-brand-green-dark/70">
                {denuncias.length} {denuncias.length === 1 ? 'denúncia' : 'denúncias'} desde a meia-noite
              </p>
              {denuncias.length === 0 && (
                <p className="py-6 text-center text-brand-green-dark/70">Nenhuma denúncia hoje.</p>
              )}
              {denuncias.map((d) => (
                <DenunciaCard key={d.id} denuncia={d} />
              ))}
            </aside>
          )}
        </div>
      )}
    </AppLayout>
  )
}
