/**
 * Ícone de ponto de ônibus (o mesmo dos marcadores de parada no mapa). Por padrão herda a cor do
 * texto ao redor (`currentColor`): verde nos chips desligados e creme nos ligados.
 */
export function IconeParada({ cor = 'currentColor', tamanho = 16 }: { cor?: string; tamanho?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke={cor}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="2.5" width="14" height="10" rx="1.5" />
      <path d="M8 6.5h8M9 9.5h.01M15 9.5h.01M12 12.5V21.5M8.5 21.5h7" />
    </svg>
  )
}
