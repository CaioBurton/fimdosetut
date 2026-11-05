import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import {
  STATUS_LABELS,
  TIPO_LABELS,
  ZONA_COLORS,
  ZONA_LABELS,
  type Denuncia,
  type Zona,
} from '../../types'
import { agruparDenuncias, normalizarVeiculo } from '../../lib/agruparDenuncias'
import { criarIconeZona } from './markerIcon'
import { BotaoMinhaLocalizacao } from './BotaoMinhaLocalizacao'
import { BotaoCalendario } from './BotaoCalendario'
import { TextoExpansivel } from '../ui/TextoExpansivel'

const TERESINA_CENTER: [number, number] = [-5.0892, -42.8019]
const ZONAS_FILTRO: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'timon', 'rural', 'outras']

export function tempoRelativo(iso: string) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  return `há ${Math.round(h / 24)} d`
}

/** "Você está aqui" no estilo da marca: bolinha creme com borda verde e sombra chapada. */
const iconeMinhaPosicao = L.divIcon({
  className: 'minha-posicao',
  html: `<div style="position:relative;width:26px;height:26px;">
      <div style="width:26px;height:26px;box-sizing:border-box;border-radius:50%;background:#f3fcee;border:3px solid #084400;box-shadow:1.5px 1.5px 0 #084400;display:flex;align-items:center;justify-content:center;">
        <div style="width:10px;height:10px;border-radius:50%;background:#084400;"></div>
      </div>
    </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

function FecharAoClicarNoMapa({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick })
  return null
}

/** Mira dentro do mapa: centraliza onde a pessoa está (o navegador pede a permissão de localização). */
function CentralizarNaMinhaLocalizacao({
  map,
  onLocalizado,
}: {
  map: L.Map | null
  onLocalizado: (pos: [number, number]) => void
}) {
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function buscar() {
    if (!map) return
    if (!navigator.geolocation) {
      setErro('Geolocalização não suportada neste navegador.')
      return
    }
    setBuscando(true)
    setErro(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ponto: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        onLocalizado(ponto)
        map.setView(ponto, Math.max(map.getZoom(), 15))
        setBuscando(false)
      },
      () => {
        setErro('Não foi possível obter sua localização.')
        setBuscando(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }

  return (
    <div
      ref={(el) => {
        // Toques no botão não podem chegar ao mapa (fechariam o cartão da denúncia selecionada).
        if (el) {
          L.DomEvent.disableClickPropagation(el)
          L.DomEvent.disableScrollPropagation(el)
        }
      }}
      className="pointer-events-auto flex flex-col items-end gap-1.5"
    >
      <BotaoMinhaLocalizacao onClick={buscar} buscando={buscando} />
      {erro && (
        <p role="alert" className="card-brand max-w-[200px] !bg-brand-cream px-2 py-1 text-xs font-semibold text-zona-leste">
          {erro}
        </p>
      )}
    </div>
  )
}

/** Avisa os limites visíveis do mapa (só quando a pessoa para de mexer, não a cada quadro do arrasto). */
function LimitesDoMapa({ onLimites }: { onLimites: (limites: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onLimites(map.getBounds().pad(0.5)),
    zoomend: () => onLimites(map.getBounds().pad(0.5)),
  })
  useEffect(() => onLimites(map.getBounds().pad(0.5)), [map, onLimites])
  return null
}

interface MarcadorDenunciaProps {
  id: string
  lat: number
  lng: number
  cor: string
  resolvido: boolean
  codigo: string
  selecionado: boolean
  quantidade: number
  pulso: number
  novo: boolean
  onSelecionar: (id: string) => void
}

/** Memoizado: selecionar uma denúncia ou mexer no filtro não refaz os outros marcadores. */
const MarcadorDenuncia = memo(function MarcadorDenuncia(p: MarcadorDenunciaProps) {
  const handlers = useMemo(() => ({ click: () => p.onSelecionar(p.id) }), [p.onSelecionar, p.id])
  return (
    <Marker
      position={[p.lat, p.lng]}
      icon={criarIconeZona(p.cor, p.resolvido, p.codigo, p.selecionado, p.quantidade, p.pulso, p.novo)}
      zIndexOffset={p.selecionado ? 1000 : 0}
      eventHandlers={handlers}
    />
  )
})

/** Entrega a instância do mapa a quem está fora do `MapContainer` (como o botão de localização). */
function CapturarMapa({ onMapa }: { onMapa: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => onMapa(map), [map, onMapa])
  return null
}

export function MapaDenuncias({
  denuncias,
  semFiltroZona = false,
  acoesSelecionada,
  focoId,
  seletorDia,
}: {
  denuncias: Denuncia[]
  /** Botão de calendário (dia das denúncias), exibido acima do botão de localização. */
  seletorDia?: { dia: string; onChange: (dia: string) => void; min: string; max: string }
  /** Ações extras no cartão da denúncia selecionada (ex.: o botão "Também vi"). */
  acoesSelecionada?: (denuncia: Denuncia) => ReactNode
  /** No desktop o filtro fica fora do mapa e a legenda das zonas aparece no lugar. */
  semFiltroZona?: boolean
  /** Denúncia a destacar ao abrir (ex.: vinda do "Ver no mapa" da lista): seleciona e centraliza nela. */
  focoId?: string
}) {
  const [filtro, setFiltro] = useState<Zona | 'todas'>('todas')
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null)
  const [mapa, setMapa] = useState<L.Map | null>(null)
  const [minhaPosicao, setMinhaPosicao] = useState<[number, number] | null>(null)
  const [limites, setLimites] = useState<L.LatLngBounds | null>(null)

  const visiveis = useMemo(
    () => denuncias.filter((d) => filtro === 'todas' || (d.linha?.zona ?? 'outras') === filtro),
    [denuncias, filtro]
  )
  const grupos = useMemo(() => agruparDenuncias(visiveis), [visiveis])
  const grupoSelecionado = grupos.find((g) => g.principal.id === selecionadaId) ?? null
  const selecionada = grupoSelecionado?.principal ?? null
  const veiculos = grupoSelecionado
    ? [
        ...new Set(
          grupoSelecionado.denuncias.map((d) => normalizarVeiculo(d.numero_veiculo)).filter(Boolean)
        ),
      ]
    : []
  // Dá um pop no marcador selecionado quando a contagem de "Também vi" dele aumenta (uma vez só; ao tirar, não).
  const [pulso, setPulso] = useState(0)
  const anterior = useRef<{ id: string; total: number } | null>(null)
  const totalSel = selecionada?.confirmacoes ?? 0
  useEffect(() => {
    const ant = anterior.current
    if (selecionada && ant && ant.id === selecionada.id && totalSel > ant.total) setPulso((n) => n + 1)
    anterior.current = selecionada ? { id: selecionada.id, total: totalSel } : null
  }, [selecionada, totalSel])

  // Denúncia recém-criada (vista pela primeira vez e com menos de 1 min): o marcador entra com pop.
  // O conjunto é limpo logo depois, para o pop não tocar de novo quando o ícone mudar (ex.: ao selecionar).
  const vistas = useRef(new Set<string>())
  const novas = useRef(new Set<string>())
  const [, setTickNovas] = useState(0)
  for (const { principal } of grupos) {
    if (vistas.current.has(principal.id)) continue
    vistas.current.add(principal.id)
    if (Date.now() - new Date(principal.created_at).getTime() < 60_000) novas.current.add(principal.id)
  }
  const qtdNovas = novas.current.size
  useEffect(() => {
    if (qtdNovas === 0) return
    const t = setTimeout(() => {
      novas.current.clear()
      setTickNovas((n) => n + 1)
    }, 900)
    return () => clearTimeout(t)
  }, [qtdNovas])

  const zonaSel = selecionada?.linha?.zona ?? 'outras'

  // "Ver no mapa": seleciona o grupo que contém a denúncia pedida e leva o mapa até ela (uma vez).
  const focoAplicado = useRef<string | null>(null)
  useEffect(() => {
    if (!focoId || !mapa || focoAplicado.current === focoId) return
    const grupo = grupos.find((g) => g.denuncias.some((d) => d.id === focoId))
    if (!grupo) return
    focoAplicado.current = focoId
    setSelecionadaId(grupo.principal.id)
    mapa.setView([grupo.principal.latitude, grupo.principal.longitude], Math.max(mapa.getZoom(), 16))
  }, [focoId, mapa, grupos])

  return (
    <div className="relative isolate h-full w-full">
      <MapContainer
        center={TERESINA_CENTER}
        zoom={13}
        scrollWheelZoom
        zoomControl={false}
        className="mapa-brand isolate h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CapturarMapa onMapa={setMapa} />
        <FecharAoClicarNoMapa onClick={() => setSelecionadaId(null)} />
        <LimitesDoMapa onLimites={setLimites} />
        {grupos.map(({ principal: denuncia, denuncias: membros }) => {
          // Só os marcadores perto da área visível: com muitas denúncias, o resto pesaria no arrasto.
          const selecionado = denuncia.id === selecionadaId
          if (limites && !selecionado && !limites.contains([denuncia.latitude, denuncia.longitude])) return null
          return (
            <MarcadorDenuncia
              key={denuncia.id}
              id={denuncia.id}
              lat={denuncia.latitude}
              lng={denuncia.longitude}
              cor={ZONA_COLORS[denuncia.linha?.zona ?? 'outras']}
              resolvido={denuncia.status === 'resolvido'}
              codigo={denuncia.linha?.codigo ?? ''}
              selecionado={selecionado}
              quantidade={membros.length}
              pulso={selecionado ? pulso : 0}
              novo={novas.current.has(denuncia.id)}
              onSelecionar={setSelecionadaId}
            />
          )
        })}
        {minhaPosicao && (
          <Marker position={minhaPosicao} icon={iconeMinhaPosicao} interactive={false} zIndexOffset={-500} />
        )}
      </MapContainer>

      {!semFiltroZona && (
      <div className="absolute inset-x-0 top-3 z-[500] flex gap-2 overflow-x-auto px-3 pb-1 sem-scrollbar">
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
      )}

      {/* No desktop a legenda das zonas fica no canto inferior esquerdo (fora deste componente): o cartão sobe para ficar acima dela. */}
      <div
        className={`pointer-events-none absolute inset-x-3 z-[500] flex max-h-[calc(100%-4.5rem)] flex-col items-end gap-2.5 ${
          semFiltroZona ? 'bottom-[5.5rem]' : 'bottom-3.5'
        }`}
      >
      <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-2.5">
        {seletorDia && (
          <div
            ref={(el) => {
              if (el) {
                L.DomEvent.disableClickPropagation(el)
                L.DomEvent.disableScrollPropagation(el)
              }
            }}
          >
            <BotaoCalendario {...seletorDia} />
          </div>
        )}
        <CentralizarNaMinhaLocalizacao map={mapa} onLocalizado={setMinhaPosicao} />
      </div>
      {selecionada && (
        <div className="card-brand anim-cartao pointer-events-auto flex min-h-0 w-full flex-col gap-2.5 !bg-brand-cream p-3.5">
          <div className="flex shrink-0 items-center gap-3">
            <span className="ttl bg-brand-green px-2.5 py-2 text-xl leading-none text-brand-cream">
              {selecionada.linha?.codigo ?? '—'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-tight">
                {selecionada.linha?.nome ?? 'Linha removida'}
              </p>
              <p className="mt-0.5 text-[13px] text-brand-green-dark/70">
                {tempoRelativo(selecionada.created_at)} · {TIPO_LABELS[selecionada.tipo]}
                {veiculos.length > 0 && ` · Veículo ${veiculos.join(', ')}`}
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
          {/* Denúncia muito longa: o texto rola dentro do cartão, sem passar por baixo do cabeçalho. */}
          <div className="min-h-0 overflow-y-auto overscroll-contain">
            <TextoExpansivel key={selecionada.id} texto={selecionada.descricao} linhas={3} className="text-sm leading-snug" />
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[13px] font-bold">
              <i
                className="block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ZONA_COLORS[zonaSel] }}
              />
              Zona {ZONA_LABELS[zonaSel]}
            </span>
            {acoesSelecionada && <div className="flex gap-2">{acoesSelecionada(selecionada)}</div>}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export { TERESINA_CENTER }
