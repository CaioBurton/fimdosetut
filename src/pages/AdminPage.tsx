import { Fragment, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { FeedbacksAdmin } from '../components/admin/FeedbacksAdmin'
import { FotosOrfasAdmin } from '../components/admin/FotosOrfasAdmin'
import { FotosPendentesAdmin } from '../components/admin/FotosPendentesAdmin'
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
import { Paginacao } from '../components/ui/Paginacao'
import { useDesktop } from '../hooks/useDesktop'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useDenuncias } from '../hooks/useDenuncias'
import { useFotosPendentes } from '../hooks/useFotosPendentes'
import { useDenunciasDoUsuario } from '../hooks/useDenunciasDoUsuario'
import { useDenunciasPorUsuario } from '../hooks/useDenunciasPorUsuario'
import { useNomesUsuarios } from '../hooks/useNomesUsuarios'
import { useLinhas } from '../hooks/useLinhas'
import { useUsuarios } from '../hooks/useUsuarios'
import { excluirDenunciaComFoto, removerFotoDaDenuncia, urlFoto } from '../lib/fotosDenuncias'
import { supabase } from '../lib/supabaseClient'
import {
  STATUS_LABELS,
  TIPO_LABELS,
  ZONA_COLORS,
  ZONA_LABELS,
  type Denuncia,
  type Perfil,
} from '../types'

type Aba = 'painel' | 'denuncias' | 'fotos' | 'linhas' | 'usuarios' | 'feedbacks'

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'painel', rotulo: 'Painel' },
  { id: 'denuncias', rotulo: 'Denúncias' },
  { id: 'fotos', rotulo: 'Fotos' },
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
  const filaFotos = useFotosPendentes()
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

  async function excluirDenuncia(id: string, fotoPath?: string | null) {
    setAcaoErro(null)
    const { error } = await excluirDenunciaComFoto(id, fotoPath)
    setConfirmando(null)
    if (error) setAcaoErro('Não foi possível excluir a denúncia. Tente novamente.')
  }

  // A denúncia continua; só a foto sai (e o arquivo é apagado do Storage).
  async function removerFoto(id: string, fotoPath: string) {
    setAcaoErro(null)
    const { error } = await removerFotoDaDenuncia(id, fotoPath)
    setConfirmando(null)
    if (error) setAcaoErro('Não foi possível remover a foto. Tente novamente.')
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
              {a.id === 'denuncias'
                ? `Denúncias (${denuncias.length})`
                : a.id === 'fotos' && !filaFotos.loading && !filaFotos.error
                  ? `Fotos (${filaFotos.total})`
                  : a.rotulo}
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
        {desktop && aba === 'fotos' && (
          <CabecalhoPagina
            titulo="Fotos"
            subtitulo={`${filaFotos.total} ${filaFotos.total === 1 ? 'foto esperando' : 'fotos esperando'} aprovação antes de aparecer nas denúncias`}
          />
        )}
        {desktop && aba === 'feedbacks' && (
          <CabecalhoPagina titulo="Feedbacks" subtitulo="O que as pessoas mandaram pelo app" />
        )}

        {acaoErro && <p role="alert" className="anim-abre text-center text-sm text-zona-leste">{acaoErro}</p>}

        <div key={aba} className="anim-entra space-y-3">
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
                    onRemoverFoto={removerFoto}
                  />
                ) : (
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
                  {filtradas.length === 0 && denuncias.length > 0 && (
                    <p className="py-6 text-center text-brand-green-dark/60">
                      Nenhuma denúncia com esses filtros.
                    </p>
                  )}
                  {filtradas.map((denuncia, i) => (
              <div key={denuncia.id} className="anim-entra" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <DenunciaCard
                denuncia={denuncia}
                actions={
                  confirmando === `foto:${denuncia.id}` && denuncia.foto_path ? (
                    <>
                      <Button
                        variant="ghost"
                        className="anim-abre w-auto flex-1 py-2 text-sm text-zona-leste"
                        onClick={() => removerFoto(denuncia.id, denuncia.foto_path!)}
                      >
                        Confirmar remoção da foto
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-auto flex-1 py-2 text-sm"
                        onClick={() => setConfirmando(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : confirmando === denuncia.id ? (
                    <>
                      <Button
                        variant="ghost"
                        className="anim-abre w-auto flex-1 py-2 text-sm text-zona-leste"
                        onClick={() => excluirDenuncia(denuncia.id, denuncia.foto_path)}
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
                      {denuncia.foto_path && (
                        <Button
                          variant="ghost"
                          className="w-full py-2 text-sm text-zona-leste"
                          onClick={() => setConfirmando(`foto:${denuncia.id}`)}
                        >
                          Remover foto
                        </Button>
                      )}
                    </>
                  )
                }
              />
              </div>
                  ))}
                </div>
                )
              }
            </DashboardDenuncias>
          </>
        )}

        {aba === 'fotos' && (
          <div className="space-y-4">
            <FotosPendentesAdmin fila={filaFotos} />
            <FotosOrfasAdmin />
          </div>
        )}

        {aba === 'feedbacks' && <FeedbacksAdmin />}

        {aba === 'usuarios' && (
          <UsuariosAdmin onErro={setAcaoErro} desktop={desktop} denuncias={denuncias} />
        )}
        </div>
      </div>
    </AppLayout>
  )
}

function DenunciasDoUsuario({ usuario, denuncias, onFechar }: { usuario: Perfil; denuncias: Denuncia[]; onFechar: () => void }) {
  const { ids, error } = useDenunciasDoUsuario(usuario.id)
  const doUsuario = ids ? denuncias.filter((d) => ids.has(d.id)) : []
  return (
    <section aria-label={`Denúncias de ${usuario.email}`} className="anim-abre space-y-3 rounded-[2px] border-2 border-brand-green p-3.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="ttl min-w-0 break-words text-lg">Denúncias de {usuario.email || 'Sem e-mail'}</h3>
        <button type="button" className={botaoTabela} onClick={onFechar}>
          Fechar
        </button>
      </div>
      {error && <p className="text-sm text-zona-leste">{error}</p>}
      {!error && ids === null && <p className="text-sm text-brand-green-dark/60">Carregando...</p>}
      {ids !== null && doUsuario.length === 0 && (
        <p className="text-sm text-brand-green-dark/60">Nenhuma denúncia encontrada.</p>
      )}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
        {doUsuario.map((d, i) => (
          <div key={d.id} className="anim-entra" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
            <DenunciaCard denuncia={d} />
          </div>
        ))}
      </div>
    </section>
  )
}

function UsuariosAdmin({
  onErro,
  desktop,
  denuncias,
}: {
  onErro: (mensagem: string | null) => void
  desktop: boolean
  denuncias: Denuncia[]
}) {
  const [verUsuarioId, setVerUsuarioId] = useState<string | null>(null)
  const totalPorUsuario = useDenunciasPorUsuario()
  const nomePorUsuario = useNomesUsuarios()
  const { user } = useAuth()
  const { usuarios, loading, error, alterarPapel, alterarBloqueio, excluir } = useUsuarios()
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const usuarioVisto = usuarios.find((u) => u.id === verUsuarioId) ?? null
  const painelDenuncias = usuarioVisto && (
    <DenunciasDoUsuario usuario={usuarioVisto} denuncias={denuncias} onFechar={() => setVerUsuarioId(null)} />
  )

  async function executar(acao: Promise<string | null>) {
    onErro(null)
    const erro = await acao
    setConfirmando(null)
    if (erro) onErro(erro)
  }

  const totalPaginas = Math.max(1, Math.ceil(usuarios.length / POR_PAGINA_TABELA))
  const atual = Math.min(pagina, totalPaginas)
  const inicio = (atual - 1) * POR_PAGINA_TABELA
  const daPagina = usuarios.slice(inicio, inicio + POR_PAGINA_TABELA)

  if (desktop) {
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
              { rotulo: 'Nome' },
              { rotulo: 'E-mail' },
              { rotulo: 'Denúncias' },
              { rotulo: 'Papel' },
              { rotulo: 'Ações', direita: true },
            ]}
          >
            {daPagina.map((u: Perfil, i) => {
              const euMesmo = u.id === user?.id
              return (
                <Fragment key={u.id}>
                <tr className="anim-entra" style={{ animationDelay: `${i * 35}ms` }}>
                  <td className={`${celula} font-bold`}>
                    {nomePorUsuario.get(u.id) || <span className="font-normal text-brand-green-dark/50">—</span>}
                    {euMesmo && ' (você)'}
                  </td>
                  <td className={celula}>{u.email || 'Sem e-mail'}</td>
                  <td className={celula}>
                    {(totalPorUsuario.get(u.id) ?? 0) > 0 ? (
                      <button
                        type="button"
                        className="font-bold underline"
                        aria-label={`Ver as ${totalPorUsuario.get(u.id)} denúncias de ${u.email || 'este usuário'}`}
                        onClick={() => setVerUsuarioId(u.id)}
                      >
                        {totalPorUsuario.get(u.id)}
                      </button>
                    ) : (
                      0
                    )}
                  </td>
                  <td className={celula}>
                    <span className="inline-flex gap-1.5">
                      {u.role === 'admin' ? <Badge color="#084400">Admin</Badge> : <Badge color="#084400" outlined>Usuário</Badge>}
                      {u.banido && <Badge color="#c23838">Bloqueado</Badge>}
                    </span>
                  </td>
                  <td className={`${celula} whitespace-nowrap text-right`}>
                    {euMesmo ? null : confirmando === u.id ? (
                      <span className="anim-abre inline-flex gap-2">
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
                {u.id === verUsuarioId && (
                  <tr>
                    <td colSpan={5} className="border-t border-[#cfe3c6] bg-[#f3fcee] p-3.5">
                      {painelDenuncias}
                    </td>
                  </tr>
                )}
                </Fragment>
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
      {daPagina.map((u: Perfil, i) => {
        const euMesmo = u.id === user?.id
        const total = totalPorUsuario.get(u.id) ?? 0
        return (
          <Fragment key={u.id}>
          <div className="card-brand anim-entra p-3.5" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {nomePorUsuario.get(u.id) && (
                  <p className="truncate font-bold text-brand-green-dark">{nomePorUsuario.get(u.id)}</p>
                )}
                <p className={`truncate ${nomePorUsuario.get(u.id) ? 'text-sm text-brand-green-dark/80' : 'font-bold text-brand-green-dark'}`}>
                  {u.email || 'Sem e-mail'}
                  {euMesmo && ' (você)'}
                </p>
                {total > 0 ? (
                  <button
                    type="button"
                    className="text-xs font-bold text-brand-green underline"
                    onClick={() => setVerUsuarioId(u.id)}
                  >
                    {total} {total === 1 ? 'denúncia' : 'denúncias'} · ver
                  </button>
                ) : (
                  <p className="text-xs text-brand-green-dark/70">0 denúncias</p>
                )}
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
                      className="anim-abre w-auto flex-1 py-2 text-sm text-zona-leste"
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
          {u.id === verUsuarioId && <div className="lg:col-span-2">{painelDenuncias}</div>}
          </Fragment>
        )
      })}
      </div>
      <Paginacao pagina={atual} totalPaginas={totalPaginas} onChange={setPagina} />
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
  onExcluir: (id: string, fotoPath?: string | null) => void
  onRemoverFoto: (id: string, fotoPath: string) => void
}

function TabelaDenuncias({ denuncias, pagina, onPagina, confirmando, onConfirmar, onAlternar, onExcluir, onRemoverFoto }: TabelaDenunciasProps) {
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
          {daPagina.map((d, i) => {
            const zona = d.linha?.zona ?? 'outras'
            return (
              <tr key={d.id} className="anim-entra" style={{ animationDelay: `${i * 35}ms` }}>
                <td className={celula}>
                  <span className="ttl inline-block bg-brand-green px-2 py-1.5 text-[15px] leading-none text-brand-cream">
                    {d.linha?.codigo ?? '—'}
                  </span>
                </td>
                <td className={`${celula} font-bold`}>
                  {TIPO_LABELS[d.tipo]}
                  {d.foto_path && (
                    <a
                      href={urlFoto(d.foto_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-xs font-bold underline"
                    >
                      Ver foto
                    </a>
                  )}
                </td>
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
                  {confirmando === `foto:${d.id}` && d.foto_path ? (
                    <span className="anim-abre inline-flex gap-2">
                      <button type="button" className={botaoPerigoTabela} onClick={() => onRemoverFoto(d.id, d.foto_path!)}>
                        Confirmar remoção da foto
                      </button>
                      <button type="button" className={botaoTabela} onClick={() => onConfirmar(null)}>
                        Cancelar
                      </button>
                    </span>
                  ) : confirmando === d.id ? (
                    <span className="anim-abre inline-flex gap-2">
                      <button type="button" className={botaoPerigoTabela} onClick={() => onExcluir(d.id, d.foto_path)}>
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
                      {d.foto_path && (
                        <button type="button" className={botaoPerigoTabela} onClick={() => onConfirmar(`foto:${d.id}`)}>
                          Remover foto
                        </button>
                      )}
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
