import { useEffect, useState } from 'react'

/** Largura a partir da qual o app usa o layout de desktop (menu lateral). Igual ao `lg:` do Tailwind. */
export const LARGURA_DESKTOP = 1024
const CONSULTA = `(min-width: ${LARGURA_DESKTOP}px)`

function lerAtual() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(CONSULTA).matches
    : false
}

/** Diz se a janela é larga o bastante para o layout de desktop. Sem `matchMedia` (testes), é falso. */
export function useDesktop() {
  const [desktop, setDesktop] = useState(lerAtual)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const consulta = window.matchMedia(CONSULTA)
    const atualizar = () => setDesktop(consulta.matches)
    atualizar()
    consulta.addEventListener('change', atualizar)
    return () => consulta.removeEventListener('change', atualizar)
  }, [])

  return desktop
}
