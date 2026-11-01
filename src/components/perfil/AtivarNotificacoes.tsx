import { useState } from 'react'
import { notificacoesSuportadas, permissaoNotificacao } from '../../lib/notificacaoNavegador'
import { Button } from '../ui/Button'
import { TituloSecao } from '../ui/TituloSecao'

export function AtivarNotificacoes({ titleId }: { titleId?: string }) {
  const [permissao, setPermissao] = useState(permissaoNotificacao)

  if (!notificacoesSuportadas()) return null

  async function ativar() {
    setPermissao(await Notification.requestPermission())
  }

  return (
    <>
      <TituloSecao id={titleId}>Avisos das minhas linhas</TituloSecao>
      <div className="card-brand space-y-3 p-4">
        <p className="text-sm text-brand-green-dark/80">
          Avisamos quando alguém reportar um problema numa linha cadastrada acima, com o app aberto.
        </p>
        {permissao === 'granted' && (
          <p className="text-sm font-bold text-brand-green">Notificações do navegador ativadas.</p>
        )}
        {permissao === 'denied' && (
          <p className="text-sm text-zona-leste">
            Notificações bloqueadas no navegador. Libere nas configurações do site. Os avisos dentro
            do app continuam funcionando.
          </p>
        )}
        {permissao === 'default' && (
          <Button type="button" variant="secondary" onClick={ativar}>
            Ativar notificações do navegador
          </Button>
        )}
      </div>
    </>
  )
}
