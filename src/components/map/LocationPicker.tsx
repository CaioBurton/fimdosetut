import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { TERESINA_CENTER } from './MapaDenuncias'
import { BotaoMinhaLocalizacao } from './BotaoMinhaLocalizacao'

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

/** Leva o mapa até o local marcado quando ele muda (ex.: a localização atual chegou depois). */
function Recentralizar({ value, pedido }: { value: { lat: number; lng: number } | null; pedido: number }) {
  const map = useMap()
  const lat = value?.lat
  const lng = value?.lng
  useEffect(() => {
    if (lat !== undefined && lng !== undefined) map.setView([lat, lng], Math.max(map.getZoom(), 15))
  }, [lat, lng, pedido, map])
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
  // Sobe a cada localização obtida: recentraliza o mapa mesmo que o ponto seja o mesmo de antes.
  const [pedidoFoco, setPedidoFoco] = useState(0)

  function usarMinhaLocalizacao(automatico = false) {
    if (!navigator.geolocation) {
      if (!automatico) setErroLocal('Geolocalização não suportada neste navegador.')
      return
    }
    setBuscandoLocal(true)
    setErroLocal(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude)
        setPedidoFoco((n) => n + 1)
        setBuscandoLocal(false)
      },
      () => {
        setErroLocal('Não foi possível obter sua localização. Toque no mapa para marcar.')
        setBuscandoLocal(false)
      },
      automatico ? { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 } : undefined
    )
  }

  // Ao abrir, já tenta marcar a localização atual (o navegador pede a permissão). Só uma vez, e
  // sem sobrescrever um local que já veio marcado.
  const tentouAutomatico = useRef(false)
  useEffect(() => {
    if (tentouAutomatico.current) return
    tentouAutomatico.current = true
    if (!value) usarMinhaLocalizacao(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const center: [number, number] = value ? [value.lat, value.lng] : TERESINA_CENTER

  return (
    <div className="space-y-3">
      <div
        className={`relative isolate h-56 w-full overflow-hidden rounded-[2px] border-2 ${
          invalido ? 'border-[#c23838]' : 'border-brand-green'
        }`}
      >
        <MapContainer center={center} zoom={value ? 15 : 12} className="isolate h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <Recentralizar value={value} pedido={pedidoFoco} />
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
        </MapContainer>
        <span className="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-[2px] border-2 border-brand-green bg-brand-cream px-2 py-1 text-xs font-bold">
          {value ? 'Local marcado' : 'Toque no mapa para marcar'}
        </span>
        <BotaoMinhaLocalizacao
          onClick={() => usarMinhaLocalizacao()}
          buscando={buscandoLocal}
          className="absolute right-2 top-2"
        />
      </div>
      {erroLocal && <p className="text-xs font-semibold text-zona-leste">{erroLocal}</p>}
      <p className="text-xs font-semibold text-brand-green-dark/70">
        Você também pode tocar no mapa para marcar o local exato.
      </p>
    </div>
  )
}
