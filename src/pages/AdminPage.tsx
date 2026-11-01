import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { FeedbacksAdmin } from '../components/admin/FeedbacksAdmin'
import { LinhasAdmin } from '../components/admin/LinhasAdmin'
import { PainelAdmin } from '../components/admin/PainelAdmin'
import { DashboardDenuncias } from '../components/admin/DashboardDenuncias'
import { DenunciaCard } from '../components/denuncia/DenunciaCard'
import { Badge } from '../components/ui/Badge'
import {
  botaoPerigoTabela,
  botaoTabela,
  celula,
  RodapeTabela,
  TabelaAdmin,
} from '../components/admin/TabelaAdmin'
import { CabecalhoPagina } from '../components/ui/CabecalhoPagina'
import { useDesktop } from '../hooks/useDesktop'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useDenuncias } from '../hooks/useDenuncias'
import { useDenunciasPorUsuario } from '../hooks/useDenunciasPorUsuario'
import { useLinhas } from '../hooks/useLinhas'
import { useUsuarios } from '../hooks/useUsuarios'
import { supabase } from '../lib/supabaseClient'
import {
  STATUS_LABELS,
  TIPO_LABELS,
  ZONA_COLORS,
  ZONA_LABELS,
  type Denuncia,
  type Perfil,
} from '../types'

type Aba = 'painel' | 'denuncias' | 'linhas' | 'usuarios' | 'feedbacks'

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'painel', rotulo: 'Painel' },
  { id: 'denuncias', rotulo: 'Denúncias' },
  { id: 'linhas', rotulo: 'Linhas' },
  { id: 'usuarios', rotulo: 'Usuários' },
  { id: 'feedbacks', rotulo: 'Feedbacks' },
]

const POR_PAGINA_TABELA = 10

function quando(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function AdminPage() {
  const desktop = useDesktop()
  const [params, setParams] = useSearchParams()
  const abaParam = params.get('aba')
  const aba: Aba = ABAS.some((a) => a.id === abaParam) ? (abaParam as Aba) : 'painel'
  const setAba = (nova: Aba) => setParams({ aba: nova })
  const [paginaDenuncias, setPaginaDenuncias] = useState(1)
  const { linhas, criar, atualizar, excluir: excluirLinha } = useLinhas()
  const { denuncias, loading, error } = useDenuncias(linhas, null)
  const [acaoErro, setAcaoErro] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)

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
        {!desktop && (
        <div
          className="sem-scrollbar flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Seções da administração"
        >
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={`chip-brand ${aba === a.id ? 'chip-brand-ativo' : ''}`}
            >
              {a.id === 'denuncias' ? `Denúncias (${denuncias.length})` : a.rotulo}
            </button>
          ))}
        </div>
        )}

        {desktop && aba === 'painel' && (
          <CabecalhoPagina titulo="Painel" subtitulo="Visão geral das denúncias e da atividade no app" />
        )}
        {desktop && aba === 'denuncias' && (
          <CabecalhoPagina
            titulo="Denúncias"
            subtitulo={`${denuncias.length} ${denuncias.length === 1 ? 'denúncia' : 'denúncias'}. Altere o status ou remova conteúdo indevido.`}
          />
        )}
        {desktop && aba === 'feedbacks' && (
          <CabecalhoPagina titulo="Feedbacks" subtitulo="O que as pessoas mandaram pelo app" />
        )}

        {acaoErro && <p className="text-center text-sm text-zona-leste">{acaoErro}</p>}

        {aba === 'painel' && (
          <>
            {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
            {loading ? (
              <p className="text-center text-brand-green-dark/60">Carregando...</p>
            ) : (
              <PainelAdmin denuncias={denuncias} onGerenciarLinhas={() => setAba('linhas')} />
            )}
          </>
        )}

        {aba === 'linhas' && (
          <LinhasAdmin
            linhas={linhas}
            denuncias={denuncias}
            onCriar={criar}
            onAtualizar={atualizar}
            onExcluir={excluirLinha}
          />
        )}

        {aba === 'denuncias' && (
          <>
            {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
            {loading && <p className="text-center text-brand-green-dark/60">Carregando...</p>}
            {!loading && !error && denuncias.length === 0 && (
              <p className="py-10 text-center text-brand-green-dark/60">
                Nenhuma denúncia cadastrada.
              </p>
            )}
            <DashboardDenuncias denuncias={denuncias} linhas={linhas}>
              {(filtradas) =>
                desktop ? (
                  <TabelaDenuncias
                    denuncias={filtradas}
                    pagina={paginaDenuncias}
                    onPagina={setPaginaDenuncias}
                    confirmando={confirmando}
                    onConfirmar={setConfirmando}
                    onAlternar={alternarStatus}
                    onExcluir={excluirDenuncia}
                  />
                ) : (
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
                  {filtradas.length === 0 && denuncias.length > 0 && (
                    <p className="py-6 text-center text-brand-green-dark/60">
                      Nenhuma denúncia com esses filtros.
                    </p>
                  )}
                  {filtradas.map((denuncia) => (
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
                </div>
                )
              }
            </DashboardDenuncias>
          </>
        )}

        {aba === 'feedbacks' && <FeedbacksAdmin />}

        {aba === 'usuarios' && (
          <UsuariosAdmin onErro={setAcaoErro} desktop={desktop} />
        )}
      </div>
    </AppLayout>
  )
}

function UsuariosAdmin({ onErro, desktop }: { onErro: (mensagem: string | null) => void; desktop: boolean }) {
  const totalPorUsuario = useDenunciasPorUsuario()
  const { user } = useAuth()
  const { usuarios, loading, error, alterarPapel, alterarBloqueio, excluir } = useUsuarios()
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)

  async function executar(acao: Promise<string | null>) {
    onErro(null)
    const erro = await acao
    setConfirmando(null)
    if (erro) onErro(erro)
  }

  if (desktop) {
    const totalPaginas = Math.max(1, Math.ceil(usuarios.length / POR_PAGINA_TABELA))
    const atual = Math.min(pagina, totalPaginas)
    const inicio = (atual - 1) * POR_PAGINA_TABELA
    const daPagina = usuarios.slice(inicio, inicio + POR_PAGINA_TABELA)
    return (
      <div className="space-y-4">
        <CabecalhoPagina
          titulo="Usuários"
          subtitulo={`${usuarios.length} ${usuarios.length === 1 ? 'conta' : 'contas'}. Bloqueie quem fizer mau uso ou exclua uma conta.`}
        />
        {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
        {loading && <p className="text-center text-brand-green-dark/60">Carregando...</p>}
        {usuarios.length > 0 && (
          <TabelaAdmin
            legenda="Lista de usuários"
            colunas={[
              { rotulo: 'E-mail' },
              { rotulo: 'Denúncias' },
              { rotulo: 'Papel' },
              { rotulo: 'Ações', direita: true },
            ]}
          >
            {daPagina.map((u: Perfil) => {
              const euMesmo = u.id === user?.id
              return (
                <tr key={u.id}>
                  <td className={`${celula} font-bold`}>
                    {u.email || 'Sem e-mail'}
                    {euMesmo && ' (você)'}
                  </td>
                  <td className={celula}>{totalPorUsuario.get(u.id) ?? 0}</td>
                  <td className={celula}>
                    <span className="inline-flex gap-1.5">
                      {u.role === 'admin' ? <Badge color="#084400">Admin</Badge> : <Badge color="#084400" outlined>Usuário</Badge>}
                      {u.banido && <Badge color="#c23838">Bloqueado</Badge>}
                    </span>
                  </td>
                  <td className={`${celula} whitespace-nowrap text-right`}>
                    {euMesmo ? null : confirmando === u.id ? (
                      <span className="inline-flex gap-2">
                        <button type="button" className={botaoPerigoTabela} onClick={() => executar(excluir(u.id))}>
                          Confirmar exclusão
                        </button>
                        <button type="button" className={botaoTabela} onClick={() => setConfirmando(null)}>
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex gap-2">
                        <button
                          type="button"
                          className={botaoTabela}
                          onClick={() => executar(alterarPapel(u.id, u.role === 'admin' ? 'user' : 'admin'))}
                        >
                          {u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                        </button>
                        <button
                          type="button"
                          className={botaoTabela}
                          onClick={() => executar(alterarBloqueio(u.id, !u.banido))}
                        >
                          {u.banido ? 'Desbloquear' : 'Bloquear'}
                        </button>
                        <button type="button" className={botaoPerigoTabela} onClick={() => setConfirmando(u.id)}>
                          Excluir
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </TabelaAdmin>
        )}
        <RodapeTabela
          inicio={inicio + 1}
          fim={inicio + daPagina.length}
          total={usuarios.length}
          pagina={atual}
          totalPaginas={totalPaginas}
          onChange={setPagina}
        />
      </div>
    )
  }

  return (
    <>
      {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
      {loading && <p className="text-center text-brand-green-dark/60">Carregando...</p>}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
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
      </div>
    </>
  )
}

interface TabelaDenunciasProps {
  denuncias: Denuncia[]
  pagina: number
  onPagina: (pagina: number) => void
  confirmando: string | null
  onConfirmar: (id: string | null) => void
  onAlternar: (id: string, statusAtual: string) => void
  onExcluir: (id: string) => void
}

function TabelaDenuncias({ denuncias, pagina, onPagina, confirmando, onConfirmar, onAlternar, onExcluir }: TabelaDenunciasProps) {
  const totalPaginas = Math.max(1, Math.ceil(denuncias.length / POR_PAGINA_TABELA))
  const atual = Math.min(pagina, totalPaginas)
  const inicio = (atual - 1) * POR_PAGINA_TABELA
  const daPagina = denuncias.slice(inicio, inicio + POR_PAGINA_TABELA)

  return (
    <div className="space-y-4">
      {denuncias.length === 0 && (
        <p className="py-6 text-center text-brand-green-dark/60">Nenhuma denúncia com esses filtros.</p>
      )}
      {denuncias.length > 0 && (
        <TabelaAdmin
          legenda="Lista de denúncias"
          colunas={[
            { rotulo: 'Linha' },
            { rotulo: 'Tipo' },
            { rotulo: 'Zona' },
            { rotulo: 'Quando' },
            { rotulo: 'Status' },
            { rotulo: 'Ações', direita: true },
          ]}
        >
          {daPagina.map((d) => {
            const zona = d.linha?.zona ?? 'outras'
            return (
              <tr key={d.id}>
                <td className={celula}>
                  <span className="ttl inline-block bg-brand-green px-2 py-1.5 text-[15px] leading-none text-brand-cream">
                    {d.linha?.codigo ?? '—'}
                  </span>
                </td>
                <td className={`${celula} font-bold`}>{TIPO_LABELS[d.tipo]}</td>
                <td className={celula}>
                  <span className="inline-flex items-center gap-1.5">
                    <i className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ZONA_COLORS[zona] }} />
                    {ZONA_LABELS[zona]}
                  </span>
                </td>
                <td className={celula}>{quando(d.created_at)}</td>
                <td className={celula}>
                  <span className="whitespace-nowrap rounded-[2px] border-2 border-brand-green px-2 py-1 text-xs font-bold">
                    {STATUS_LABELS[d.status]}
                  </span>
                </td>
                <td className={`${celula} whitespace-nowrap text-right`}>
                  {confirmando === d.id ? (
                    <span className="inline-flex gap-2">
                      <button type="button" className={botaoPerigoTabela} onClick={() => onExcluir(d.id)}>
                        Confirmar exclusão
                      </button>
                      <button type="button" className={botaoTabela} onClick={() => onConfirmar(null)}>
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex gap-2">
                      <button type="button" className={botaoTabela} onClick={() => onAlternar(d.id, d.status)}>
                        {d.status === 'pendente' ? 'Resolver' : 'Reabrir'}
                      </button>
                      <button type="button" className={botaoPerigoTabela} onClick={() => onConfirmar(d.id)}>
                        Excluir
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </TabelaAdmin>
      )}
      <RodapeTabela
        inicio={inicio + 1}
        fim={inicio + daPagina.length}
        total={denuncias.length}
        pagina={atual}
        totalPaginas={totalPaginas}
        onChange={onPagina}
      />
    </div>
  )
}
