const EVENTO = 'linhas-do-perfil-alteradas'

/** Avisa (na mesma aba) que o usuário adicionou/removeu uma linha do perfil, para os alertas recarregarem a lista. */
export function avisarLinhasDoPerfilAlteradas() {
  window.dispatchEvent(new Event(EVENTO))
}

/** Chama `aoAlterar` quando as linhas do perfil mudam (nesta aba) ou quando a aba volta a ficar visível (mudança em outra aba). */
export function aoAlterarLinhasDoPerfil(aoAlterar: () => void) {
  const aoVoltar = () => {
    if (document.visibilityState === 'visible') aoAlterar()
  }
  window.addEventListener(EVENTO, aoAlterar)
  document.addEventListener('visibilitychange', aoVoltar)
  return () => {
    window.removeEventListener(EVENTO, aoAlterar)
    document.removeEventListener('visibilitychange', aoVoltar)
  }
}
