import { useSyncExternalStore } from 'react'
import { instalarApp, observarInstalacao, podeInstalar } from '../../lib/pwa'
import { Button } from '../ui/Button'

// Só aparece quando o navegador oferece a instalação (Chrome/Edge/Samsung Internet)
// e o app ainda não está instalado.
export function InstalarApp() {
  const disponivel = useSyncExternalStore(observarInstalacao, podeInstalar)
  if (!disponivel) return null

  return (
    <Button type="button" variant="secondary" className="mt-4" onClick={() => void instalarApp()}>
      Instalar o app
    </Button>
  )
}
