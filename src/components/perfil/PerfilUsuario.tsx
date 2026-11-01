import { useState, type SyntheticEvent } from 'react'
import { usePerfilUsuario } from '../../hooks/usePerfilUsuario'
import type { Linha, PerfilDetalhes } from '../../types'
import { LinhaSelect } from '../denuncia/LinhaSelect'
import { Button } from '../ui/Button'

interface PerfilUsuarioProps {
  userId: string
  email: string
  criadoEm?: string
  linhas: Linha[]
}

export function PerfilUsuario({ userId, email, criadoEm, linhas }: PerfilUsuarioProps) {
  const { detalhes, linhaIds, loading, error, salvarDetalhes, adicionarLinha, removerLinha } =
    usePerfilUsuario(userId)
  const [rascunho, setRascunho] = useState<PerfilDetalhes | null>(null)
  const [novaLinha, setNovaLinha] = useState('')
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  const form = rascunho ?? detalhes
  const minhasLinhas = linhaIds
    .map((id) => linhas.find((l) => l.id === id))
    .filter((l): l is Linha => !!l)
  const linhasDisponiveis = linhas.filter((l) => !linhaIds.includes(l.id))

  function alterar(campo: keyof PerfilDetalhes, valor: string) {
    setMensagem(null)
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
      setMensagem({ tipo: 'erro', texto: erro })
    } else {
      setRascunho(null)
      setMensagem({ tipo: 'ok', texto: 'Dados salvos.' })
    }
  }

  async function adicionar() {
    if (!novaLinha) return
    const erro = await adicionarLinha(novaLinha)
    if (erro) setMensagem({ tipo: 'erro', texto: erro })
    else setNovaLinha('')
  }

  async function remover(id: string) {
    const erro = await removerLinha(id)
    if (erro) setMensagem({ tipo: 'erro', texto: erro })
  }

  return (
    <section className="card-brand space-y-4 p-4" aria-label="Informações do perfil">
      <div>
        <h2 className="ttl text-xl">Meus dados</h2>
        <p className="text-sm text-brand-green-dark">{email}</p>
        {criadoEm && (
          <p className="text-xs text-brand-green-dark/60">
            Membro desde {new Date(criadoEm).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-zona-leste">{error}</p>}
      {mensagem && (
        <p className={`text-sm ${mensagem.tipo === 'erro' ? 'text-zona-leste' : 'text-brand-green'}`}>
          {mensagem.texto}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-brand-green-dark/60">Carregando perfil...</p>
      ) : (
        <>
          <form onSubmit={salvar} className="space-y-3">
            <label className="block text-sm font-bold">
              Bairro onde mora
              <input
                className="input-brand mt-1 font-normal"
                value={form.bairro_moradia}
                onChange={(e) => alterar('bairro_moradia', e.target.value)}
              />
            </label>
            <label className="block text-sm font-bold">
              Local de trabalho
              <input
                className="input-brand mt-1 font-normal"
                value={form.local_trabalho}
                onChange={(e) => alterar('local_trabalho', e.target.value)}
              />
            </label>
            <label className="block text-sm font-bold">
              Local de estudo
              <input
                className="input-brand mt-1 font-normal"
                value={form.local_estudo}
                onChange={(e) => alterar('local_estudo', e.target.value)}
              />
            </label>
            <Button type="submit">Salvar dados</Button>
          </form>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Linhas que eu pego</h3>
            {minhasLinhas.length === 0 ? (
              <p className="text-sm text-brand-green-dark/60">Nenhuma linha cadastrada.</p>
            ) : (
              <ul className="space-y-2">
                {minhasLinhas.map((linha) => (
                  <li
                    key={linha.id}
                    className="flex items-center justify-between gap-2 border-2 border-brand-green px-3 py-2 text-sm"
                  >
                    <span>
                      {linha.codigo} - {linha.nome}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remover linha ${linha.codigo}`}
                      className="font-bold text-zona-leste"
                      onClick={() => remover(linha.id)}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <LinhaSelect linhas={linhasDisponiveis} value={novaLinha} onChange={setNovaLinha} />
            <Button type="button" variant="secondary" disabled={!novaLinha} onClick={adicionar}>
              Adicionar linha
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
