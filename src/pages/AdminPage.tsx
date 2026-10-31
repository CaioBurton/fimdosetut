import { useMemo, useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { DenunciaCard } from '../components/denuncia/DenunciaCard'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useDenuncias } from '../hooks/useDenuncias'
import { useLinhas } from '../hooks/useLinhas'
import { useUsuarios } from '../hooks/useUsuarios'
import { supabase } from '../lib/supabaseClient'
import type { Perfil } from '../types'

type Aba = 'denuncias' | 'usuarios'

export function AdminPage() {
  const [aba, setAba] = useState<Aba>('denuncias')
  const { linhas } = useLinhas()
  const { denuncias, loading, error } = useDenuncias(linhas)
  const [acaoErro, setAcaoErro] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const totalPorUsuario = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const d of denuncias) mapa.set(d.user_id, (mapa.get(d.user_id) ?? 0) + 1)
    return mapa
  }, [denuncias])

  async function alternarStatus(id: string, statusAtual: string) {
    setAcaoErro(null)
    const { error } = await supabase
      .from('denuncias')
      .update({ status: statusAtual === 'pendente' ? 'resolvido' : 'pendente' })
      .eq('id', id)
    if (error) setAcaoErro('Não foi possível atualizar a denúncia. Tente novamente.')
  }

  async function excluirDenuncia(id: string) {
    setAcaoErro(null)
    const { error } = await supabase.from('denuncias').delete().eq('id', id)
    setConfirmando(null)
    if (error) setAcaoErro('Não foi possível excluir a denúncia. Tente novamente.')
  }

  return (
    <AppLayout title="Administração">
      <div className="space-y-3 p-4">
        <div className="flex gap-2" role="tablist" aria-label="Seções da administração">
          {(['denuncias', 'usuarios'] as const).map((a) => (
            <button
              key={a}
              type="button"
              role="tab"
              aria-selected={aba === a}
              onClick={() => setAba(a)}
              className={`chip-brand ${aba === a ? 'chip-brand-ativo' : ''}`}
            >
              {a === 'denuncias' ? `Denúncias (${denuncias.length})` : 'Usuários'}
            </button>
          ))}
        </div>

        {acaoErro && <p className="text-center text-sm text-zona-leste">{acaoErro}</p>}

        {aba === 'denuncias' ? (
          <>
            {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
            {loading && <p className="text-center text-brand-green-dark/60">Carregando...</p>}
            {!loading && !error && denuncias.length === 0 && (
              <p className="py-10 text-center text-brand-green-dark/60">
                Nenhuma denúncia cadastrada.
              </p>
            )}
            {denuncias.map((denuncia) => (
              <DenunciaCard
                key={denuncia.id}
                denuncia={denuncia}
                actions={
                  confirmando === denuncia.id ? (
                    <>
                      <Button
                        variant="ghost"
                        className="w-auto flex-1 py-2 text-sm text-zona-leste"
                        onClick={() => excluirDenuncia(denuncia.id)}
                      >
                        Confirmar exclusão
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-auto flex-1 py-2 text-sm"
                        onClick={() => setConfirmando(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        className="w-auto flex-1 py-2 text-sm"
                        onClick={() => alternarStatus(denuncia.id, denuncia.status)}
                      >
                        {denuncia.status === 'pendente' ? 'Marcar resolvido' : 'Reabrir'}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-auto flex-1 py-2 text-sm text-zona-leste"
                        onClick={() => setConfirmando(denuncia.id)}
                      >
                        Excluir
                      </Button>
                    </>
                  )
                }
              />
            ))}
          </>
        ) : (
          <UsuariosAdmin totalPorUsuario={totalPorUsuario} onErro={setAcaoErro} />
        )}
      </div>
    </AppLayout>
  )
}

function UsuariosAdmin({
  totalPorUsuario,
  onErro,
}: {
  totalPorUsuario: Map<string, number>
  onErro: (mensagem: string | null) => void
}) {
  const { user } = useAuth()
  const { usuarios, loading, error, alterarPapel, alterarBloqueio, excluir } = useUsuarios()
  const [confirmando, setConfirmando] = useState<string | null>(null)

  async function executar(acao: Promise<string | null>) {
    onErro(null)
    const erro = await acao
    setConfirmando(null)
    if (erro) onErro(erro)
  }

  return (
    <>
      {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
      {loading && <p className="text-center text-brand-green-dark/60">Carregando...</p>}
      {usuarios.map((u: Perfil) => {
        const euMesmo = u.id === user?.id
        const total = totalPorUsuario.get(u.id) ?? 0
        return (
          <div key={u.id} className="card-brand p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-bold text-brand-green-dark">
                  {u.email || 'Sem e-mail'}
                  {euMesmo && ' (você)'}
                </p>
                <p className="text-xs text-brand-green-dark/70">
                  {total} {total === 1 ? 'denúncia' : 'denúncias'}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {u.role === 'admin' && <Badge color="#084400">Admin</Badge>}
                {u.banido && <Badge color="#c23838">Bloqueado</Badge>}
              </div>
            </div>

            {!euMesmo && (
              <div className="mt-3 flex flex-wrap gap-2">
                {confirmando === u.id ? (
                  <>
                    <Button
                      variant="ghost"
                      className="w-auto flex-1 py-2 text-sm text-zona-leste"
                      onClick={() => executar(excluir(u.id))}
                    >
                      Confirmar exclusão
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-auto flex-1 py-2 text-sm"
                      onClick={() => setConfirmando(null)}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      className="w-auto flex-1 py-2 text-sm"
                      onClick={() =>
                        executar(alterarPapel(u.id, u.role === 'admin' ? 'user' : 'admin'))
                      }
                    >
                      {u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-auto flex-1 py-2 text-sm"
                      onClick={() => executar(alterarBloqueio(u.id, !u.banido))}
                    >
                      {u.banido ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-auto flex-1 py-2 text-sm text-zona-leste"
                      onClick={() => setConfirmando(u.id)}
                    >
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
