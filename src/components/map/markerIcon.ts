import L from 'leaflet'

const EXPLOSAO =
  'M 0.04 85.6 L 55 89 L 48.9 45.9 L 80.6 55.7 L 88.9 31.6 L 116.8 47.4 L 116.8 0 L 154.3 39.9 L 171.3 7.5 L 191.3 51.4 L 235.3 25.2 L 226.3 61.8 L 253.3 55.7 L 253.7 73 L 273.7 78.4 L 250.3 90 L 268.2 122.1 L 231 99.8 L 236.1 166 L 182.4 122.9 L 168.5 160.5 L 126.9 131.6 L 121 159.3 L 92.9 130.2 L 57.4 151.4 L 73.6 129.1 L 32.4 145.6 L 48.1 105.5 Z'

export function criarIconeZona(
  cor: string,
  resolvido: boolean,
  codigo = '',
  selecionado = false
) {
  const opacidade = resolvido ? 0.45 : 1
  const rotulo = codigo || (resolvido ? '✓' : '!')
  const largura = selecionado ? 92 : 62
  const altura = selecionado ? 58 : 40
  const fonte = selecionado ? 15 : 11
  const corTexto = cor === '#d9a404' ? '#141a10' : '#fff'

  return L.divIcon({
    className: 'denuncia-marker',
    html: `<div style="position: relative; width: ${largura}px; height: ${altura}px; opacity: ${opacidade};">
      <svg viewBox="0 0 274 166" width="${largura}" height="${altura}" aria-hidden="true">
        <path fill="${cor}" stroke="#084400" stroke-width="6" stroke-linejoin="round" d="${EXPLOSAO}" />
      </svg>
      <span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: ${corTexto}; font-family: 'Proxima Nova', sans-serif; font-weight: 800; font-size: ${fonte}px;">${rotulo}</span>
    </div>`,
    iconSize: [largura, altura],
    iconAnchor: [largura / 2, altura / 2],
  })
}
