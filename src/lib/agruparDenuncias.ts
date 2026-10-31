import type { Denuncia } from '../types'

export const RAIO_AGRUPAMENTO_METROS = 300
export const JANELA_AGRUPAMENTO_MINUTOS = 60

export interface GrupoDenuncias {
  /** Denúncia mais recente do grupo; define a posição do marcador. */
  principal: Denuncia
  denuncias: Denuncia[]
}

export function normalizarVeiculo(numero?: string | null) {
  return (numero ?? '').trim().toUpperCase()
}

export function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function pertenceAoGrupo(d: Denuncia, grupo: GrupoDenuncias) {
  const p = grupo.principal
  if (d.linha_id !== p.linha_id || d.tipo !== p.tipo || d.status !== p.status) return false

  const diffMin =
    Math.abs(new Date(p.created_at).getTime() - new Date(d.created_at).getTime()) / 60000
  if (diffMin > JANELA_AGRUPAMENTO_MINUTOS) return false

  // Mesmo veículo informado = mesmo problema, independente da distância.
  const veiculo = normalizarVeiculo(d.numero_veiculo)
  if (veiculo && grupo.denuncias.some((g) => normalizarVeiculo(g.numero_veiculo) === veiculo)) {
    return true
  }

  return (
    distanciaMetros(p.latitude, p.longitude, d.latitude, d.longitude) <= RAIO_AGRUPAMENTO_METROS
  )
}

/**
 * Agrupa denúncias da mesma linha, tipo e status que ocorreram perto uma da outra
 * (ou citam o mesmo veículo) dentro de uma janela de tempo.
 */
export function agruparDenuncias(denuncias: Denuncia[]): GrupoDenuncias[] {
  const ordenadas = [...denuncias].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const grupos: GrupoDenuncias[] = []

  for (const d of ordenadas) {
    const grupo = grupos.find((g) => pertenceAoGrupo(d, g))
    if (grupo) grupo.denuncias.push(d)
    else grupos.push({ principal: d, denuncias: [d] })
  }

  return grupos
}
