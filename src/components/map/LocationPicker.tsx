import { useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { TERESINA_CENTER } from './MapaDenuncias'

const pinIcon = L.divIcon({
  className: 'picker-marker',
  html: `<div style="position: relative; width: 84px; height: 52px; filter: drop-shadow(3px 3px 0 rgba(8,68,0,0.35));">
      <img src="/brand/explosao-cheia.svg" alt="" style="width: 100%; height: 100%;" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F3FCEE" stroke-width="3" stroke-linecap="round" style="position: absolute; left: 31px; top: 15px;" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
    </div>`,
  iconSize: [84, 52],
  iconAnchor: [42, 26],
})

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface LocationPickerProps {
  value: { lat: number; lng: number } | null
  onChange: (lat: number, lng: number) => void
  /** Destaca o mapa em vermelho quando falta marcar o local. */
  invalido?: boolean
}

export function LocationPicker({ value, onChange, invalido = false }: LocationPickerProps) {
  const [buscandoLocal, setBuscandoLocal] = useState(false)
  const [erroLocal, setErroLocal] = useState<string | null>(null)

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      setErroLocal('Geolocalização não suportada neste navegador.')
      return
    }
    setBuscandoLocal(true)
    setErroLocal(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude)
        setBuscandoLocal(false)
      },
      () => {
        setErroLocal('Não foi possível obter sua localização. Toque no mapa para marcar.')
        setBuscandoLocal(false)
      }
    )
  }

  const center: [number, number] = value ? [value.lat, value.lng] : TERESINA_CENTER

  return (
    <div className="space-y-3">
      <div
        className={`relative h-56 w-full overflow-hidden rounded-[2px] border-2 ${
          invalido ? 'border-[#c23838]' : 'border-brand-green'
        }`}
      >
        <MapContainer center={center} zoom={value ? 15 : 12} className="isolate h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
        </MapContainer>
        <span className="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-[2px] border-2 border-brand-green bg-brand-cream px-2 py-1 text-xs font-bold">
          {value ? 'Local marcado' : 'Toque no mapa para marcar'}
        </span>
      </div>
      <button
        type="button"
        onClick={usarMinhaLocalizacao}
        disabled={buscandoLocal}
        className="ttl flex min-h-12 w-full items-center justify-center gap-2.5 rounded-[2px] border-2 border-brand-green text-sm text-brand-green disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="8" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        {buscandoLocal ? 'Buscando localização...' : 'Usar minha localização atual'}
      </button>
      {erroLocal && <p className="text-xs font-semibold text-zona-leste">{erroLocal}</p>}
      <p className="text-xs font-semibold text-brand-green-dark/70">
        Você também pode tocar no mapa para marcar o local exato.
      </p>
    </div>
  )
}
