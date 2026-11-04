import { DIAS_PADRAO } from '../hooks/useDenuncias'

/** Data local no formato yyyy-mm-dd, o mesmo valor do <input type="date">. */
export function diaLocal(iso: string) {
  const data = new Date(iso)
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

export const hoje = () => diaLocal(new Date().toISOString())
/** As denúncias só carregam os últimos DIAS_PADRAO dias; datas anteriores ficariam sempre vazias. */
export const diaMinimo = () =>
  diaLocal(new Date(Date.now() - DIAS_PADRAO * 24 * 60 * 60 * 1000).toISOString())

/** Quantos dias para trás o calendário do mapa deixa escolher. O mapa busca um dia por vez, então pode ir bem mais longe que a lista (que baixa os últimos DIAS_PADRAO dias de uma vez). */
export const DIAS_CALENDARIO_MAPA = 365
export const diaMinimoMapa = () =>
  diaLocal(new Date(Date.now() - DIAS_CALENDARIO_MAPA * 24 * 60 * 60 * 1000).toISOString())
