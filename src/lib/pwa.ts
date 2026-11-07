// Registra o service worker (só em produção, para não atrapalhar o dev server).
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// Instalação do app. O navegador dispara `beforeinstallprompt` uma vez, logo no
// começo; guardamos o evento aqui para o botão "Instalar" usar quando quiser.
interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let eventoInstalacao: EventoInstalacao | null = null
const ouvintes = new Set<() => void>()

function avisar() {
  ouvintes.forEach((fn) => fn())
}

export function capturarInstalacao() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    eventoInstalacao = e as EventoInstalacao
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    eventoInstalacao = null
    avisar()
  })
}

export function observarInstalacao(fn: () => void) {
  ouvintes.add(fn)
  return () => {
    ouvintes.delete(fn)
  }
}

export function podeInstalar() {
  return eventoInstalacao !== null
}

export async function instalarApp() {
  const evento = eventoInstalacao
  if (!evento) return
  await evento.prompt()
  await evento.userChoice
  // O navegador só aceita usar o evento uma vez.
  eventoInstalacao = null
  avisar()
}
