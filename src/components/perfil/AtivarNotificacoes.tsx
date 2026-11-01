import { useState } from 'react'
import { notificacoesSuportadas, permissaoNotificacao } from '../../lib/notificacaoNavegador'

const DICAS = {
  default: 'Ativar avisos de problemas nas minhas linhas (com o app aberto)',
  granted: 'Avisos do navegador ativados',
  denied: 'Avisos bloqueados no navegador. Libere nas configurações do site.',
} as const

export function AtivarNotificacoes() {
  const [permissao, setPermissao] = useState(permissaoNotificacao)

  if (!notificacoesSuportadas()) return null

  async function ativar() {
    setPermissao(await Notification.requestPermission())
  }

  const estado = permissao === 'granted' || permissao === 'denied' ? permissao : 'default'
  const ativo = estado === 'granted'
  const bloqueado = estado === 'denied'

  return (
    <button
      type="button"
      aria-label={DICAS[estado]}
      title={DICAS[estado]}
      aria-pressed={ativo}
      disabled={estado !== 'default'}
      onClick={ativar}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border-2 disabled:cursor-default ${
        ativo
          ? 'border-brand-green bg-brand-green text-brand-cream'
          : bloqueado
            ? 'border-[#c23838] bg-brand-cream text-[#c23838]'
            : 'border-brand-green bg-brand-cream text-brand-green'
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 21h4" />
        {bloqueado && <path d="M4 4l16 16" />}
      </svg>
    </button>
  )
}
