import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import {
  STATUS_LABELS,
  TIPO_LABELS,
  ZONA_COLORS,
  ZONA_LABELS,
  type Denuncia,
  type Zona,
} from '../../types'
import { criarIconeZona } from './markerIcon'

const TERESINA_CENTER: [number, number] = [-5.0892, -42.8019]
const ZONAS_FILTRO: Zona[] = ['norte', 'sul', 'leste', 'sudeste']

function tempoRelativo(iso: string) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  return `há ${Math.round(h / 24)} d`
}

function FecharAoClicarNoMapa({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick })
  return null
}

export function MapaDenuncias({ denuncias }: { denuncias: Denuncia[] }) {
  const [filtro, setFiltro] = useState<Zona | 'todas'>('todas')
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null)

  const visiveis = useMemo(
    () => denuncias.filter((d) => filtro === 'todas' || (d.linha?.zona ?? 'outras') === filtro),
    [denuncias, filtro]
  )
  const selecionada = visiveis.find((d) => d.id === selecionadaId) ?? null
  const relatos = selecionada
    ? denuncias.filter((d) => d.linha_id === selecionada.linha_id).length
    : 0
  const zonaSel = selecionada?.linha?.zona ?? 'outras'

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={TERESINA_CENTER}
        zoom={12}
        scrollWheelZoom
        zoomControl={false}
        className="mapa-brand isolate h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FecharAoClicarNoMapa onClick={() => setSelecionadaId(null)} />
        {visiveis.map((denuncia) => {
          const zona = denuncia.linha?.zona ?? 'outras'
          return (
            <Marker
              key={denuncia.id}
              position={[denuncia.latitude, denuncia.longitude]}
              icon={criarIconeZona(
                ZONA_COLORS[zona],
                denuncia.status === 'resolvido',
                denuncia.linha?.codigo ?? '',
                denuncia.id === selecionadaId
              )}
              zIndexOffset={denuncia.id === selecionadaId ? 1000 : 0}
              eventHandlers={{ click: () => setSelecionadaId(denuncia.id) }}
            />
          )
        })}
      </MapContainer>

      <div className="absolute inset-x-0 top-3 z-[500] flex gap-2 overflow-x-auto px-3 pb-1">
        <button
          type="button"
          onClick={() => setFiltro('todas')}
          aria-pressed={filtro === 'todas'}
          className={`chip-brand ${filtro === 'todas' ? 'chip-brand-ativo' : ''}`}
        >
          Todas
        </button>
        {ZONAS_FILTRO.map((zona) => (
          <button
            key={zona}
            type="button"
            onClick={() => setFiltro(zona)}
            aria-pressed={filtro === zona}
            className={`chip-brand ${filtro === zona ? 'chip-brand-ativo' : ''}`}
          >
            <i
              className="block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: ZONA_COLORS[zona] }}
            />
            {ZONA_LABELS[zona]}
          </button>
        ))}
      </div>

      {selecionada && (
        <div className="card-brand absolute inset-x-3 bottom-3.5 z-[500] flex flex-col gap-2.5 !bg-brand-cream p-3.5">
          <div className="flex items-center gap-3">
            <span className="ttl bg-brand-green px-2.5 py-2 text-xl leading-none text-brand-cream">
              {selecionada.linha?.codigo ?? '—'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-tight">
                {selecionada.linha?.nome ?? 'Linha removida'}
              </p>
              <p className="mt-0.5 text-[13px] text-brand-green-dark/70">
                {tempoRelativo(selecionada.created_at)} · {TIPO_LABELS[selecionada.tipo]}
              </p>
            </div>
            <span
              className="ttl rounded-[2px] px-2 py-1 text-[11px] !not-italic text-white"
              style={{
                backgroundColor: selecionada.status === 'resolvido' ? '#4b5563' : '#c23838',
              }}
            >
              {STATUS_LABELS[selecionada.status]}
            </span>
          </div>
          <p className="text-sm leading-snug">{selecionada.descricao}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[13px] font-bold">
              <i
                className="block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ZONA_COLORS[zonaSel] }}
              />
              Zona {ZONA_LABELS[zonaSel]} · {relatos} {relatos === 1 ? 'relato' : 'relatos'}
            </span>
            <Link
              to="/denuncias"
              className="flex min-h-11 items-center text-sm font-bold underline"
            >
              Ver detalhes →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export { TERESINA_CENTER }
