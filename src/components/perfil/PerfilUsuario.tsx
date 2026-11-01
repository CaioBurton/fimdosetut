import { useState, type SyntheticEvent } from 'react'
import { usePerfilUsuario } from '../../hooks/usePerfilUsuario'
import { ZONA_COLORS, ZONA_LABELS, type Linha, type PerfilDetalhes } from '../../types'
import { LinhaSelect } from '../denuncia/LinhaSelect'
import { Button } from '../ui/Button'
import { TituloSecao } from '../ui/TituloSecao'
import { AtivarNotificacoes } from './AtivarNotificacoes'

interface PerfilUsuarioProps {
  userId: string
  email: string
  criadoEm?: string
  linhas: Linha[]
  totalDenuncias?: number
  totalResolvidas?: number
}

type Mensagem = { tipo: 'ok' | 'erro'; texto: string }

function Estatistica({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="card-brand p-3">
      <p className="ttl text-3xl">{valor}</p>
      <p className="mt-1 text-xs font-bold text-brand-green-dark/70">{rotulo}</p>
    </div>
  )
}

function Aviso({ mensagem }: { mensagem: Mensagem | null }) {
  if (!mensagem) return null
  return mensagem.tipo === 'erro' ? (
    <p role="alert" className="text-sm font-semibold text-zona-leste">
      {mensagem.texto}
    </p>
  ) : (
    <p role="status" className="flex items-center gap-2 text-sm font-bold">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12l5 5 9-10" />
      </svg>
      {mensagem.texto}
    </p>
  )
}

export function PerfilUsuario({
  userId,
  email,
  criadoEm,
  linhas,
  totalDenuncias = 0,
  totalResolvidas = 0,
}: PerfilUsuarioProps) {
  const { detalhes, linhaIds, loading, error, salvarDetalhes, adicionarLinha, removerLinha } =
    usePerfilUsuario(userId)
  const [rascunho, setRascunho] = useState<PerfilDetalhes | null>(null)
  const [novaLinha, setNovaLinha] = useState('')
  const [msgDados, setMsgDados] = useState<Mensagem | null>(null)
  const [msgLinhas, setMsgLinhas] = useState<Mensagem | null>(null)

  const form = rascunho ?? detalhes
  const minhasLinhas = linhaIds
    .map((id) => linhas.find((l) => l.id === id))
    .filter((l): l is Linha => !!l)
  const linhasDisponiveis = linhas.filter((l) => !linhaIds.includes(l.id))
  const inicial = (email.trim()[0] ?? '?').toUpperCase()

  function alterar(campo: keyof PerfilDetalhes, valor: string) {
    setMsgDados(null)
    setRascunho({ ...form, [campo]: valor })
  }

  async function salvar(e: SyntheticEvent) {
    e.preventDefault()
    const erro = await salvarDetalhes({
      bairro_moradia: form.bairro_moradia.trim(),
      local_trabalho: form.local_trabalho.trim(),
      local_estudo: form.local_estudo.trim(),
    })
    if (erro) {
      setMsgDados({ tipo: 'erro', texto: erro })
    } else {
      setRascunho(null)
      setMsgDados({ tipo: 'ok', texto: 'Dados salvos.' })
    }
  }

  async function adicionar() {
    if (!novaLinha) return
    setMsgLinhas(null)
    const erro = await adicionarLinha(novaLinha)
    if (erro) setMsgLinhas({ tipo: 'erro', texto: erro })
    else setNovaLinha('')
  }

  async function remover(id: string) {
    setMsgLinhas(null)
    const erro = await removerLinha(id)
    if (erro) setMsgLinhas({ tipo: 'erro', texto: erro })
  }

  return (
    <div className="space-y-7">
      <section aria-label="Resumo do perfil" className="-mx-4 -mt-4">
        <div className="relative h-[104px] overflow-hidden border-b-[3px] border-brand-green bg-brand-green">
          <img
            src="/brand/onibus-bandeira.svg"
            alt=""
            aria-hidden="true"
            className="tom-sobre-tom absolute -bottom-4 -right-[70px] w-[330px] max-w-none"
          />
        </div>
        <div className="relative -mt-10 px-4">
          <div className="relative flex h-16 w-[104px] items-center justify-center">
            <img
              src="/brand/explosao-cheia.svg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full drop-shadow-[3px_3px_0_#052d00]"
            />
            <span className="ttl relative text-[34px] leading-none text-brand-cream" aria-hidden="true">
              {inicial}
            </span>
          </div>
          <h2 className="mt-3 break-all text-xl font-bold leading-tight">{email}</h2>
          {criadoEm && (
            <p className="mt-0.5 text-sm font-medium text-brand-green-dark/70">
              Membro desde {new Date(criadoEm).toLocaleDateString('pt-BR')}
            </p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <Estatistica valor={totalDenuncias} rotulo="Denúncias" />
            <Estatistica valor={totalResolvidas} rotulo="Resolvidas" />
            <Estatistica valor={minhasLinhas.length} rotulo="Minhas linhas" />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-zona-leste">{error}</p>}

      {loading ? (
        <p className="text-sm text-brand-green-dark/60">Carregando perfil...</p>
      ) : (
        <>
          <section aria-labelledby="perfil-dados">
            <TituloSecao id="perfil-dados">Meus dados</TituloSecao>
            <form onSubmit={salvar} className="card-brand space-y-3.5 p-4">
              <label className="block text-xs font-bold uppercase tracking-wide">
                Bairro onde mora
                <input
                  className="input-brand mt-1.5 text-base font-normal normal-case tracking-normal"
                  value={form.bairro_moradia}
                  onChange={(e) => alterar('bairro_moradia', e.target.value)}
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide">
                Local de trabalho
                <input
                  className="input-brand mt-1.5 text-base font-normal normal-case tracking-normal"
                  value={form.local_trabalho}
                  onChange={(e) => alterar('local_trabalho', e.target.value)}
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide">
                Local de estudo
                <input
                  className="input-brand mt-1.5 text-base font-normal normal-case tracking-normal"
                  value={form.local_estudo}
                  onChange={(e) => alterar('local_estudo', e.target.value)}
                />
              </label>
              <Button type="submit">Salvar dados</Button>
              <Aviso mensagem={msgDados} />
            </form>
          </section>

          <section aria-labelledby="perfil-linhas">
            <TituloSecao id="perfil-linhas">Linhas que eu pego</TituloSecao>
            <div className="card-brand space-y-3 p-4">
              {minhasLinhas.length === 0 ? (
                <p className="text-sm text-brand-green-dark/70">Nenhuma linha cadastrada.</p>
              ) : (
                <ul className="space-y-2.5">
                  {minhasLinhas.map((linha) => (
                    <li
                      key={linha.id}
                      className="flex items-center gap-3 rounded-[2px] border-2 border-brand-green bg-brand-cream py-2.5 pl-3 pr-2.5"
                    >
                      <span className="ttl bg-brand-green px-2.5 py-2 text-[17px] leading-none text-brand-cream">
                        {linha.codigo}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold leading-tight">{linha.nome}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-brand-green-dark/70">
                          <i
                            className="block h-[9px] w-[9px] rounded-full"
                            style={{ backgroundColor: ZONA_COLORS[linha.zona] }}
                          />
                          Zona {ZONA_LABELS[linha.zona]}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remover linha ${linha.codigo}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border-2 border-[#c23838] bg-brand-cream text-[#c23838]"
                        onClick={() => remover(linha.id)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2.5 border-t-2 border-brand-green pt-3.5">
                <p className="text-xs font-bold uppercase tracking-wide">Adicionar uma linha</p>
                <LinhaSelect linhas={linhasDisponiveis} value={novaLinha} onChange={setNovaLinha} />
                <Button type="button" variant="secondary" disabled={!novaLinha} onClick={adicionar}>
                  Adicionar linha
                </Button>
                <Aviso mensagem={msgLinhas} />
              </div>
            </div>
          </section>

          <section aria-labelledby="perfil-avisos">
            <AtivarNotificacoes titleId="perfil-avisos" />
          </section>
        </>
      )}
    </div>
  )
}
