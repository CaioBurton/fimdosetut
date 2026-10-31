import L from 'leaflet'

export function criarIconeZona(cor: string, resolvido: boolean) {
  const opacidade = resolvido ? 0.45 : 1
  const simbolo = resolvido ? '✓' : '!'

  return L.divIcon({
    className: 'denuncia-marker',
    html: `<div style="
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${cor};
        opacity: ${opacidade};
        border: 2px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); color: white; font-weight: 700; font-size: 14px;">${simbolo}</span>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  })
}
