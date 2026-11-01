import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAceiteDocumentos } from '../../hooks/useAceiteDocumentos'
import { DATA_DOCUMENTOS, ROTAS_LEGAIS } from '../../lib/legal'
import { Button } from '../ui/Button'
import { LinksLegais } from './LinksLegais'

const ROTAS_LIVRES: string[] = [ROTAS_LEGAIS.privacidade, ROTAS_LEGAIS.termos]

/**
 * Pede o aceite da versão atual dos documentos a quem já tem conta e ainda não aceitou (contas
 * criadas antes da política ou antes de uma atualização). Não aparece nas próprias páginas dos
 * documentos, para a pessoa conseguir lê-los antes de decidir.
 */
export function AceiteDocumentos() {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()
  const { precisaAceitar, aceitar, salvando, erro } = useAceiteDocumentos(user?.id)

  if (!precisaAceitar || ROTAS_LIVRES.includes(pathname)) return null

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-brand-green-dark/85 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="aceite-titulo"
        className="card-brand flex max-h-full w-full max-w-sm flex-col gap-4 overflow-y-auto !bg-brand-cream p-5"
      >
        <div className="space-y-2">
          <h2 id="aceite-titulo" className="ttl text-2xl text-brand-green">
            Atualizamos nossos documentos
          </h2>
          <p className="text-sm leading-snug text-brand-green-dark">
            Para continuar usando o Deu o Prego!, leia e aceite a Política de Privacidade e os Termos
            de Uso (versão de {DATA_DOCUMENTOS}). Neles explicamos quais dados guardamos, para quê e
            como você pode pedir a exclusão deles.
          </p>
        </div>

        <LinksLegais novaAba className="!justify-start" />

        {erro && (
          <p role="alert" className="text-sm font-semibold text-zona-leste">
            {erro}
          </p>
        )}

        <div className="space-y-2.5">
          <Button type="button" disabled={salvando} onClick={aceitar}>
            {salvando ? 'Registrando...' : 'Li e concordo'}
          </Button>
          <button
            type="button"
            onClick={() => signOut()}
            className="min-h-11 w-full text-sm font-bold text-brand-green underline"
          >
            Não concordo, sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
