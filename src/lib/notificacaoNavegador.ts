export function notificacoesSuportadas() {
  return typeof Notification !== 'undefined'
}

export function permissaoNotificacao(): NotificationPermission | 'indisponivel' {
  return notificacoesSuportadas() ? Notification.permission : 'indisponivel'
}

export function notificarNavegador(titulo: string, corpo: string) {
  if (!notificacoesSuportadas() || Notification.permission !== 'granted') return
  try {
    new Notification(titulo, { body: corpo, icon: '/brand/explosao-cheia.svg' })
  } catch {
    // alguns navegadores móveis só permitem notificações via service worker
  }
}
