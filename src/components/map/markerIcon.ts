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
  novo = false
) {
  const chave = JSON.stringify([cor, resolvido, codigo, selecionado, quantidade, pulso, novo])
  let icone = cache.get(chave)
  if (!icone) {
    icone = montarIcone(cor, resolvido, codigo, selecionado, quantidade, novo)
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
  novo = false
) {
  const contador =
    quantidade > 1
      ? `<span style="position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; padding: 0 5px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: #084400; color: #fff; border: 2px solid #fff; font-family: 'Proxima Nova', sans-serif; font-weight: 800; font-size: 11px; line-height: 1;">${quantidade}</span>`
      : ''
  const opacidade = resolvido ? 0.45 : 1
  const rotulo = codigo || (resolvido ? '✓' : '!')
  const largura = selecionado ? 92 : 62
  const altura = selecionado ? 58 : 40
  const fonte = selecionado ? 15 : 11
  const corTexto = cor === '#d9a404' ? '#141a10' : '#fff'

  return L.divIcon({
    className: 'denuncia-marker',
    html: `<div style="position: relative; width: ${largura}px; height: ${altura}px; opacity: ${opacidade};${selecionado ? ' animation: marcador-pop 360ms var(--ease-mola) both;' : novo ? ' animation: pop 420ms var(--ease-mola) both;' : ''}">
      <svg viewBox="0 0 274 166" width="${largura}" height="${altura}" aria-hidden="true">
        <path fill="${cor}" stroke="#084400" stroke-width="6" stroke-linejoin="round" d="${EXPLOSAO}" />
      </svg>
      <span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: ${corTexto}; font-family: 'Proxima Nova', sans-serif; font-weight: 800; font-size: ${fonte}px;">${rotulo}</span>
      ${contador}
    </div>`,
    iconSize: [largura, altura],
    iconAnchor: [largura / 2, altura / 2],
  })
}
