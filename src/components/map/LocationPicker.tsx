import { useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Button } from '../ui/Button'
import { TERESINA_CENTER } from './MapaDenuncias'

const pinIcon = L.divIcon({
  className: 'picker-marker',
  html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
      background: #084400; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
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
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
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
    <div className="space-y-2">
      <div className="h-56 w-full overflow-hidden rounded-xl border border-brand-green/20">
        <MapContainer center={center} zoom={value ? 15 : 12} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
        </MapContainer>
      </div>
      <Button type="button" variant="secondary" onClick={usarMinhaLocalizacao} disabled={buscandoLocal}>
        {buscandoLocal ? 'Buscando localização...' : 'Usar minha localização atual'}
      </Button>
      {erroLocal && <p className="text-xs text-zona-leste">{erroLocal}</p>}
      <p className="text-xs text-brand-green-dark/60">
        Você também pode tocar no mapa para marcar o local exato.
      </p>
    </div>
  )
}
