import L from 'leaflet'

export function criarIconeZona(cor: string, resolvido: boolean) {
  const opacidade = resolvido ? 0.45 : 1
  const simbolo = resolvido ? '✓' : '!'

  return L.divIcon({
    className: 'denuncia-marker',
    html: `<div style="filter: drop-shadow(2px 2px 0 #084400);">
      <div style="
        width: 30px;
        height: 30px;
        clip-path: polygon(0.0% 51.6%, 20.1% 53.7%, 17.9% 27.7%, 29.5% 33.5%, 32.5% 19.0%, 42.7% 28.6%, 42.7% 0.0%, 56.4% 24.1%, 62.6% 4.5%, 69.9% 31.0%, 86.0% 15.2%, 82.7% 37.2%, 92.6% 33.5%, 92.7% 44.0%, 100.0% 47.2%, 91.4% 54.3%, 98.0% 73.6%, 84.4% 60.1%, 86.3% 100.0%, 66.6% 74.0%, 61.5% 96.7%, 46.4% 79.2%, 44.2% 96.0%, 33.9% 78.4%, 21.0% 91.2%, 26.9% 77.8%, 11.8% 87.7%, 17.6% 63.5%);
        background: ${cor};
        opacity: ${opacidade};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="color: #fff; font-weight: 800; font-size: 13px; text-shadow: 0 0 2px #084400;">${simbolo}</span>
      </div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  })
}
