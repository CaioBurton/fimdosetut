import { useMemo, useState, type FormEvent } from 'react'
import { useDesktop } from '../../hooks/useDesktop'
import type { DadosLinha } from '../../hooks/useLinhas'
import { CabecalhoPagina } from '../ui/CabecalhoPagina'
import { botaoPerigoTabela, botaoTabela, celula, RodapeTabela, TabelaAdmin } from './TabelaAdmin'
import { ZONA_COLORS, ZONA_LABELS, type Denuncia, type Linha, type Zona } from '../../types'

const ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'outras']

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

interface Props {
  linhas: Linha[]
  denuncias: Denuncia[]
  onCriar: (dados: DadosLinha) => Promise<string | null>
  onAtualizar: (id: string, dados: DadosLinha) => Promise<string | null>
  onExcluir: (id: string) => Promise<string | null>
}

const POR_PAGINA = 10

type Edicao = { modo: 'nova' } | { modo: 'editar'; linha: Linha }

export function LinhasAdmin({ linhas, denuncias, onCriar, onAtualizar, onExcluir }: Props) {
  const [busca, setBusca] = useState('')
  const [zona, setZona] = useState<Zona | 'todas'>('todas')
  const [edicao, setEdicao] = useState<Edicao | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const desktop = useDesktop()

  const totalPorLinha = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const d of denuncias) mapa.set(d.linha_id, (mapa.get(d.linha_id) ?? 0) + 1)
    return mapa
  }, [denuncias])

  const contagemZona = useMemo(() => {
    const mapa = new Map<Zona, number>()
    for (const l of linhas) mapa.set(l.zona, (mapa.get(l.zona) ?? 0) + 1)
    return mapa
  }, [linhas])

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim())
    return linhas.filter(
      (l) =>
        (zona === 'todas' || l.zona === zona) &&
        (!termo || normalizar(`${l.codigo} ${l.nome}`).includes(termo))
    )
  }, [linhas, busca, zona])

  async function excluir(id: string) {
    setErro(null)
    const resultado = await onExcluir(id)
    setConfirmando(null)
    if (resultado) setErro(resultado)
  }

  if (desktop) {
    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
    const atual = Math.min(pagina, totalPaginas)
    const inicio = (atual - 1) * POR_PAGINA
    const daPagina = filtradas.slice(inicio, inicio + POR_PAGINA)
    const zonasUsadas = new Set(linhas.map((l) => l.zona)).size

    return (
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[999_1_520px] space-y-5">
          <CabecalhoPagina
            titulo="Linhas"
            subtitulo={`${linhas.length} ${linhas.length === 1 ? 'linha' : 'linhas'} em ${zonasUsadas} ${zonasUsadas === 1 ? 'zona' : 'zonas'}`}
          >
            <button
              type="button"
              onClick={() => {
                setErro(null)
                setEdicao({ modo: 'nova' })
              }}
              className="ttl flex min-h-[52px] items-center gap-2.5 rounded-[2px] border-2 border-brand-green bg-brand-green px-[22px] text-base text-brand-cream shadow-[4px_4px_0_#052d00]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nova linha
            </button>
          </CabecalhoPagina>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              className="input-brand min-w-[260px] flex-1"
              placeholder="Número ou nome da linha"
              aria-label="Buscar linha"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="flex flex-wrap gap-2" aria-label="Filtrar por zona">
              <button
                type="button"
                aria-pressed={zona === 'todas'}
                onClick={() => setZona('todas')}
                className={`chip-brand ${zona === 'todas' ? 'chip-brand-ativo' : ''}`}
              >
                Todas · {linhas.length}
              </button>
              {ZONAS.map((z) => (
                <button
                  key={z}
                  type="button"
                  aria-pressed={zona === z}
                  onClick={() => setZona(z)}
                  className={`chip-brand ${zona === z ? 'chip-brand-ativo' : ''}`}
                >
                  <i className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ZONA_COLORS[z] }} />
                  {ZONA_LABELS[z]} · {contagemZona.get(z) ?? 0}
                </button>
              ))}
            </div>
          </div>

          {erro && (
            <p role="alert" className="text-sm font-semibold text-zona-leste">
              {erro}
            </p>
          )}

          {filtradas.length === 0 ? (
            <p className="py-8 text-center text-brand-green-dark/70">Nenhuma linha encontrada.</p>
          ) : (
            <TabelaAdmin
              legenda="Lista de linhas de ônibus"
              minLargura={520}
              colunas={[
                { rotulo: 'Código' },
                { rotulo: 'Nome' },
                { rotulo: 'Zona' },
                { rotulo: 'Denúncias' },
                { rotulo: 'Ações', direita: true },
              ]}
            >
              {daPagina.map((linha) => {
                const total = totalPorLinha.get(linha.id) ?? 0
                const selecionada = edicao?.modo === 'editar' && edicao.linha.id === linha.id
                return (
                  <tr key={linha.id} className={selecionada ? 'bg-[#e3f2da]' : ''}>
                    <td className={celula}>
                      <span className="ttl inline-block bg-brand-green px-2 py-1.5 text-[15px] leading-none text-brand-cream">
                        {linha.codigo}
                      </span>
                    </td>
                    <td className={`${celula} font-bold`}>{linha.nome}</td>
                    <td className={celula}>
                      <span className="inline-flex items-center gap-1.5">
                        <i className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ZONA_COLORS[linha.zona] }} />
                        {ZONA_LABELS[linha.zona]}
                      </span>
                    </td>
                    <td className={celula}>{total}</td>
                    <td className={`${celula} whitespace-nowrap text-right`}>
                      {confirmando === linha.id ? (
                        <span className="inline-flex items-center gap-2">
                          <button type="button" className={botaoPerigoTabela} onClick={() => excluir(linha.id)}>
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
                            aria-label={`Editar linha ${linha.codigo}`}
                            className={botaoTabela}
                            onClick={() => {
                              setErro(null)
                              setEdicao({ modo: 'editar', linha })
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M4 20h4L19 9l-4-4L4 16v4z" />
                              <path d="M13.5 6.5l4 4" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            aria-label={`Excluir linha ${linha.codigo}`}
                            title={total > 0 ? 'Tem denúncias: não pode ser excluída' : 'Excluir linha'}
                            disabled={total > 0}
                            className={botaoPerigoTabela}
                            onClick={() => setConfirmando(linha.id)}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                            </svg>
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
            total={filtradas.length}
            pagina={atual}
            totalPaginas={totalPaginas}
            onChange={setPagina}
          />
        </div>

        <div className="w-full max-w-[380px] flex-[1_1_320px] self-start">
          {edicao ? (
            <FormularioLinha
              key={edicao.modo === 'editar' ? edicao.linha.id : 'nova'}
              embutido
              linha={edicao.modo === 'editar' ? edicao.linha : null}
              existentes={linhas}
              totalDenuncias={edicao.modo === 'editar' ? (totalPorLinha.get(edicao.linha.id) ?? 0) : 0}
              onCancelar={() => setEdicao(null)}
              onSalvar={async (dados) => {
                const resultado =
                  edicao.modo === 'editar' ? await onAtualizar(edicao.linha.id, dados) : await onCriar(dados)
                if (!resultado) setEdicao(null)
                return resultado
              }}
            />
          ) : (
            <aside
              aria-label="Editar linha"
              className="card-brand p-5 text-sm font-medium text-brand-green-dark/80"
            >
              <h2 className="ttl mb-2 text-[26px]">Editar linha</h2>
              Escolha uma linha na tabela para editar, ou crie uma nova.
            </aside>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="relative flex flex-col gap-3.5 overflow-hidden rounded-[2px] border-2 border-brand-green bg-brand-green p-[18px] text-brand-cream shadow-[4px_4px_0_#052d00]">
        <img
          src="/brand/catraca.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -right-1.5 w-24 max-w-none opacity-40 brightness-[2.2]"
        />
        <div className="relative">
          <h2 className="ttl text-4xl">Linhas</h2>
          <p className="mt-2 text-sm font-medium">
            {linhas.length} {linhas.length === 1 ? 'linha' : 'linhas'}. Crie, edite ou remova as
            linhas que aparecem no app.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setErro(null)
            setEdicao({ modo: 'nova' })
          }}
          className="ttl relative flex min-h-[52px] items-center justify-center gap-2.5 rounded-[2px] border-2 border-brand-cream bg-brand-cream text-[17px] text-brand-green"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova linha
        </button>
      </section>

      <div className="space-y-2.5">
        <input
          type="search"
          className="input-brand"
          placeholder="Número ou nome da linha"
          aria-label="Buscar linha"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="sem-scrollbar flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por zona">
          <button
            type="button"
            aria-pressed={zona === 'todas'}
            onClick={() => setZona('todas')}
            className={`chip-brand ${zona === 'todas' ? 'chip-brand-ativo' : ''}`}
          >
            Todas · {linhas.length}
          </button>
          {ZONAS.map((z) => (
            <button
              key={z}
              type="button"
              aria-pressed={zona === z}
              onClick={() => setZona(z)}
              className={`chip-brand ${zona === z ? 'chip-brand-ativo' : ''}`}
            >
              <i className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ZONA_COLORS[z] }} />
              {ZONA_LABELS[z]} · {contagemZona.get(z) ?? 0}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <p role="alert" className="text-center text-sm font-semibold text-zona-leste">
          {erro}
        </p>
      )}

      {filtradas.length === 0 && (
        <p className="py-8 text-center text-brand-green-dark/70">Nenhuma linha encontrada.</p>
      )}

      <ul className="space-y-3.5 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
        {filtradas.map((linha) => {
          const total = totalPorLinha.get(linha.id) ?? 0
          const bloqueada = total > 0
          return (
            <li key={linha.id} className="card-brand flex flex-col gap-2.5 self-start p-3">
              <div className="flex items-center gap-3">
                <span className="ttl min-w-[34px] bg-brand-green px-2.5 py-2 text-center text-lg leading-none text-brand-cream">
                  {linha.codigo}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold leading-tight">{linha.nome}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-brand-green-dark/70">
                    <i className="block h-[9px] w-[9px] rounded-full" style={{ backgroundColor: ZONA_COLORS[linha.zona] }} />
                    Zona {ZONA_LABELS[linha.zona]} · {total} {total === 1 ? 'denúncia' : 'denúncias'}
                  </p>
                </div>
                {confirmando !== linha.id && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label={`Editar linha ${linha.codigo}`}
                      onClick={() => {
                        setErro(null)
                        setEdicao({ modo: 'editar', linha })
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-[2px] border-2 border-brand-green"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 20h4L19 9l-4-4L4 16v4z" />
                        <path d="M13.5 6.5l4 4" />
                      </svg>
                    </button>
                    <span className="group relative inline-flex" tabIndex={bloqueada ? 0 : undefined}>
                    <button
                      type="button"
                      aria-label={`Excluir linha ${linha.codigo}`}
                      aria-describedby={bloqueada ? `dica-${linha.id}` : undefined}
                      disabled={bloqueada}
                      onClick={() => setConfirmando(linha.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-[2px] border-2 border-[#c23838] text-[#c23838] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                      </svg>
                    </button>
                      {bloqueada && (
                        <span
                          id={`dica-${linha.id}`}
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 hidden w-60 rounded-[2px] bg-brand-green-dark px-3 py-2 text-left text-xs font-semibold leading-snug text-brand-cream shadow-lg group-hover:block group-focus:block"
                        >
                          Não pode ser excluída enquanto tiver denúncias. Edite o nome ou a zona, ou apague as
                          denúncias antes.
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {confirmando === linha.id && (
                <div className="space-y-2 border-t border-[#cfe3c6] pt-2.5">
                  <p className="text-sm font-bold">
                    Excluir a linha {linha.codigo}? Isso não pode ser desfeito.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => excluir(linha.id)}
                      className="ttl min-h-11 flex-1 rounded-[2px] border-2 border-[#c23838] bg-[#c23838] text-sm text-white"
                    >
                      Confirmar exclusão
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      className="ttl min-h-11 flex-1 rounded-[2px] border-2 border-brand-green text-sm text-brand-green"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {edicao && (
        <FormularioLinha
          key={edicao.modo === 'editar' ? edicao.linha.id : 'nova'}
          linha={edicao.modo === 'editar' ? edicao.linha : null}
          existentes={linhas}
          totalDenuncias={edicao.modo === 'editar' ? (totalPorLinha.get(edicao.linha.id) ?? 0) : 0}
          onCancelar={() => setEdicao(null)}
          onSalvar={async (dados) => {
            const resultado =
              edicao.modo === 'editar'
                ? await onAtualizar(edicao.linha.id, dados)
                : await onCriar(dados)
            if (!resultado) setEdicao(null)
            return resultado
          }}
        />
      )}
    </div>
  )
}

interface FormularioProps {
  /** No desktop o formulário fica num painel ao lado da tabela, em vez de numa janela. */
  embutido?: boolean
  linha: Linha | null
  existentes: Linha[]
  totalDenuncias: number
  onCancelar: () => void
  onSalvar: (dados: DadosLinha) => Promise<string | null>
}

function FormularioLinha({ embutido = false, linha, existentes, totalDenuncias, onCancelar, onSalvar }: FormularioProps) {
  const [codigo, setCodigo] = useState(linha?.codigo ?? '')
  const [nome, setNome] = useState(linha?.nome ?? '')
  const [zona, setZona] = useState<Zona>(linha?.zona ?? 'norte')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const dados = { codigo: codigo.trim(), nome: nome.trim().toUpperCase(), zona }
    if (!dados.codigo || !dados.nome) {
      setErro('Preencha o código e o nome da linha.')
      return
    }
    if (existentes.some((l) => l.id !== linha?.id && l.codigo.toLowerCase() === dados.codigo.toLowerCase())) {
      setErro('Já existe uma linha com esse código.')
      return
    }
    setSalvando(true)
    setErro(null)
    const resultado = await onSalvar(dados)
    setSalvando(false)
    if (resultado) setErro(resultado)
  }

  const corpo = (
    <>
        {!embutido && <div className="mx-auto mb-3 h-[5px] w-11 rounded-[2px] bg-brand-green" />}
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            <h2 id="linha-titulo" className="ttl text-3xl">
              {linha ? 'Editar linha' : 'Nova linha'}
            </h2>
            <p className="mt-1.5 text-sm font-medium text-brand-green-dark/70">
              As mudanças aparecem na hora no mapa e nos formulários.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onCancelar}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] border-2 border-brand-green"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
            <div>
              <label htmlFor="linha-codigo" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
                Código
              </label>
              <input
                id="linha-codigo"
                className="input-brand ttl !text-xl"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="linha-nome" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
                Nome
              </label>
              <input
                id="linha-nome"
                className="input-brand"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
          </div>

          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-xs font-bold uppercase tracking-wide">Zona</legend>
            <div className="grid grid-cols-2 gap-2">
              {ZONAS.map((z) => (
                <label
                  key={z}
                  className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[2px] border-2 border-brand-green px-3 text-sm font-bold ${
                    zona === z ? 'bg-brand-green text-brand-cream' : 'bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="zona"
                    value={z}
                    checked={zona === z}
                    onChange={() => setZona(z)}
                    className="h-[18px] w-[18px] accent-[#084400]"
                  />
                  <i
                    className="block h-2.5 w-2.5 rounded-full border border-brand-cream"
                    style={{ backgroundColor: ZONA_COLORS[z] }}
                  />
                  {ZONA_LABELS[z]}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide">Como vai aparecer</p>
            <div className="card-brand flex items-center gap-3 p-3">
              <span className="ttl bg-brand-green px-2.5 py-2 text-lg leading-none text-brand-cream">
                {codigo.trim() || '---'}
              </span>
              <div>
                <p className="text-[15px] font-bold">{nome.trim().toUpperCase() || 'NOME DA LINHA'}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-brand-green-dark/70">
                  <i className="block h-[9px] w-[9px] rounded-full" style={{ backgroundColor: ZONA_COLORS[zona] }} />
                  Zona {ZONA_LABELS[zona]}
                </p>
              </div>
            </div>
          </div>

          {erro && (
            <p role="alert" className="text-sm font-semibold text-zona-leste">
              {erro}
            </p>
          )}

          <div className="space-y-2.5">
            <button
              type="submit"
              disabled={salvando}
              className="ttl flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[2px] border-2 border-brand-green bg-brand-green text-[17px] text-brand-cream disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : linha ? 'Salvar alterações' : 'Criar linha'}
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="ttl min-h-12 w-full rounded-[2px] border-2 border-brand-green text-[15px] text-brand-green"
            >
              Cancelar
            </button>
          </div>

          {linha && totalDenuncias > 0 && (
            <p className="text-center text-xs font-semibold text-brand-green-dark/70">
              Esta linha tem {totalDenuncias} {totalDenuncias === 1 ? 'denúncia' : 'denúncias'}, então
              não pode ser excluída.
            </p>
          )}
        </form>
    </>
  )

  if (embutido) {
    return (
      <aside aria-labelledby="linha-titulo" className="card-brand p-5">
        {corpo}
      </aside>
    )
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-brand-green-dark/75 lg:items-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="linha-titulo"
        className="max-h-full w-full max-w-md overflow-y-auto border-t-[3px] border-brand-green bg-brand-cream px-5 pb-6 pt-3 shadow-[0_-4px_0_#052d00] lg:border-[3px] lg:pt-5 lg:shadow-[6px_6px_0_#052d00]"
      >
        {corpo}
      </section>
    </div>
  )
}
