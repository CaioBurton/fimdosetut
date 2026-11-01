import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { definirAvisoLogin } from '../../lib/avisoLogin'
import { baixarJson } from '../../lib/baixarArquivo'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../ui/Button'
import { TituloSecao } from '../ui/TituloSecao'

export const PALAVRA_CONFIRMACAO = 'EXCLUIR'

function mensagemDeErro(erro: { message?: string }) {
  if (erro.message?.includes('único administrador')) {
    return 'Você é o único administrador do app. Torne outra pessoa administradora antes de excluir a sua conta.'
  }
  return 'Não foi possível excluir a conta. Tente novamente.'
}

/** Direitos do titular (LGPD, art. 18): baixar uma cópia dos dados e excluir a conta. */
export function MeusDadosPrivacidade() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [baixando, setBaixando] = useState(false)
  const [erroDados, setErroDados] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [palavra, setPalavra] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [erroConta, setErroConta] = useState<string | null>(null)

  async function baixar() {
    setBaixando(true)
    setErroDados(null)
    const { data, error } = await supabase.rpc('exportar_meus_dados')
    setBaixando(false)
    if (error || !data) {
      setErroDados('Não foi possível gerar a cópia dos seus dados. Tente novamente.')
      return
    }
    const hoje = new Date().toISOString().slice(0, 10)
    baixarJson(`meus-dados-deu-o-prego-${hoje}.json`, data)
  }

  async function excluir() {
    setExcluindo(true)
    setErroConta(null)
    const { error } = await supabase.rpc('excluir_minha_conta')
    if (error) {
      setExcluindo(false)
      setErroConta(mensagemDeErro(error))
      return
    }
    // O recado vai para a tela de login por fora da rota: ao perder a sessão, a tela do Perfil
    // (protegida) também redireciona para o login, e o que vem no estado da rota se perderia.
    definirAvisoLogin('Sua conta foi excluída e os seus dados foram apagados.')
    navigate('/login', { replace: true })
    await signOut()
  }

  function cancelar() {
    setConfirmando(false)
    setPalavra('')
    setErroConta(null)
  }

  return (
    <section aria-labelledby="perfil-privacidade">
      <TituloSecao id="perfil-privacidade">Meus dados e privacidade</TituloSecao>
      <div className="card-brand space-y-4 p-4">
        <div className="space-y-2.5">
          <p className="text-sm font-medium text-brand-green-dark/80">
            Você pode baixar uma cópia de tudo o que guardamos sobre você: conta, perfil, linhas,
            denúncias e feedbacks.
          </p>
          <Button type="button" variant="secondary" disabled={baixando} onClick={baixar}>
            {baixando ? 'Gerando...' : 'Baixar meus dados'}
          </Button>
          {erroDados && (
            <p role="alert" className="text-sm font-semibold text-zona-leste">
              {erroDados}
            </p>
          )}
        </div>

        <div className="space-y-2.5 border-t-2 border-brand-green pt-4">
          {!confirmando ? (
            <>
              <p className="text-sm font-medium text-brand-green-dark/80">
                Se não quiser mais usar o app, você pode excluir a sua conta.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="!border-[#c23838] text-[#c23838]"
                onClick={() => setConfirmando(true)}
              >
                Excluir minha conta
              </Button>
            </>
          ) : (
            <div className="space-y-3" role="group" aria-label="Confirmar exclusão da conta">
              <p className="text-sm font-bold text-[#8f1f1f]">Isso não pode ser desfeito.</p>
              <ul className="ml-4 list-disc space-y-1 text-sm font-medium">
                <li>Apagamos o seu login, o seu perfil e as linhas que você cadastrou.</li>
                <li>Apagamos todas as denúncias que você enviou (elas somem do mapa).</li>
                <li>Seus feedbacks podem ficar, mas sem nenhuma identificação.</li>
              </ul>
              <div>
                <label htmlFor="confirmar-exclusao" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
                  Digite {PALAVRA_CONFIRMACAO} para confirmar
                </label>
                <input
                  id="confirmar-exclusao"
                  className="input-brand"
                  autoComplete="off"
                  value={palavra}
                  onChange={(e) => setPalavra(e.target.value)}
                />
              </div>
              {erroConta && (
                <p role="alert" className="text-sm font-semibold text-zona-leste">
                  {erroConta}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={palavra.trim().toUpperCase() !== PALAVRA_CONFIRMACAO || excluindo}
                  onClick={excluir}
                  className="ttl min-h-12 flex-1 rounded-[2px] border-2 border-[#c23838] bg-[#c23838] text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {excluindo ? 'Excluindo...' : 'Excluir definitivamente'}
                </button>
                <button
                  type="button"
                  onClick={cancelar}
                  disabled={excluindo}
                  className="ttl min-h-12 flex-1 rounded-[2px] border-2 border-brand-green text-sm text-brand-green"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
