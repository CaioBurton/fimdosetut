import L from 'leaflet'
import { EXPLOSAO_PATH as EXPLOSAO } from '../../lib/marca'


const cache = new Map<string, L.DivIcon>()

/** Devolve sempre o mesmo ícone para os mesmos parâmetros: um ícone novo a cada render faz o
 * Leaflet recriar o marcador e a animação de seleção tocar de novo. */
export function criarIconeZona(
  cor: string,
  resolvido: boolean,
  codigo = '',
  selecionado = false,
  quantidade = 1,
  pulso = 0,
  novo = false,
  parada = false
) {
  const chave = JSON.stringify([cor, resolvido, codigo, selecionado, quantidade, pulso, novo, parada])
  let icone = cache.get(chave)
  if (!icone) {
    icone = montarIcone(cor, resolvido, codigo, selecionado, quantidade, novo, parada)
    cache.set(chave, icone)
  }
  return icone
}

function montarIcone(
  cor: string,
  resolvido: boolean,
  codigo = '',
  selecionado = false,
  quantidade = 1,
  novo = false,
  parada = false
) {
  const contador =
    quantidade > 1
      ? `<span style="position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; padding: 0 5px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: #084400; color: #fff; border: 2px solid #fff; font-family: 'Proxima Nova', sans-serif; font-weight: 800; font-size: 11px; line-height: 1;">${quantidade}</span>`
      : ''
  const opacidade = resolvido ? 0.45 : 1
  const rotulo = parada ? '' : codigo || (resolvido ? '✓' : '!')
  const largura = selecionado ? 92 : 62
  const altura = selecionado ? 58 : 40
  const fonte = selecionado ? 15 : 11
  const corTexto = cor === '#d9a404' ? '#141a10' : '#fff'
  // Denúncia de parada: a mesma explosão em verde claro da marca, com o ícone de ponto de ônibus.
  const preenchimento = parada ? '#f3fcee' : cor
  const lado = selecionado ? 34 : 24
  const iconeParada = parada
    ? `<svg viewBox="0 0 24 24" width="${lado}" height="${lado}" fill="none" stroke="#084400" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2.5" width="14" height="10" rx="1.5"/><path d="M8 6.5h8M9 9.5h.01M15 9.5h.01M12 12.5V21.5M8.5 21.5h7"/></svg>`
    : ''

  return L.divIcon({
    className: 'denuncia-marker',
    html: `<div style="position: relative; width: ${largura}px; height: ${altura}px; opacity: ${opacidade};${selecionado ? ' animation: marcador-pop 360ms var(--ease-mola) both;' : novo ? ' animation: pop 420ms var(--ease-mola) both;' : ''}">
      <svg viewBox="0 0 274 166" width="${largura}" height="${altura}" aria-hidden="true" style="overflow: visible">
        <path fill="rgba(8,68,0,0.35)" transform="translate(9 9)" d="${EXPLOSAO}" />
        <path fill="${preenchimento}" stroke="#084400" stroke-width="6" stroke-linejoin="round" d="${EXPLOSAO}" />
      </svg>
      <span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: ${corTexto}; font-family: 'Proxima Nova', sans-serif; font-weight: 800; font-size: ${fonte}px;">${parada ? iconeParada : rotulo}</span>
      ${contador}
    </div>`,
    iconSize: [largura, altura],
    iconAnchor: [largura / 2, altura / 2],
  })
}
