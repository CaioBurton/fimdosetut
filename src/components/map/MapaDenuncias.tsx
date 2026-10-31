import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { TIPO_LABELS, ZONA_COLORS, ZONA_LABELS, type Denuncia } from '../../types'
import { criarIconeZona } from './markerIcon'

const TERESINA_CENTER: [number, number] = [-5.0892, -42.8019]

export function MapaDenuncias({ denuncias }: { denuncias: Denuncia[] }) {
  return (
    <MapContainer
      center={TERESINA_CENTER}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {denuncias.map((denuncia) => {
        const zona = denuncia.linha?.zona ?? 'outras'
        const cor = ZONA_COLORS[zona]
        return (
          <Marker
            key={denuncia.id}
            position={[denuncia.latitude, denuncia.longitude]}
            icon={criarIconeZona(cor, denuncia.status === 'resolvido')}
          >
            <Popup>
              <div className="font-sans text-sm">
                <p className="font-semibold">
                  {denuncia.linha ? `${denuncia.linha.codigo} - ${denuncia.linha.nome}` : 'Linha'}
                </p>
                <p className="text-xs text-black/60">{ZONA_LABELS[zona]}</p>
                <p className="mt-1">
                  <span className="font-semibold">{TIPO_LABELS[denuncia.tipo]}</span>
                  {' · '}
                  {denuncia.status === 'resolvido' ? 'Resolvido' : 'Pendente'}
                </p>
                <p className="mt-1">{denuncia.descricao}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

export { TERESINA_CENTER }
