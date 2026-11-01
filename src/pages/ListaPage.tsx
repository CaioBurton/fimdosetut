import { useState } from 'react'
import { CabecalhoPagina } from '../components/ui/CabecalhoPagina'
import { RodapeTabela } from '../components/admin/TabelaAdmin'
import { useDesktop } from '../hooks/useDesktop'
import { AppLayout } from '../components/layout/AppLayout'
import { LinhaSelect } from '../components/denuncia/LinhaSelect'
import { BotaoTambemVi } from '../components/denuncia/BotaoTambemVi'
import { DenunciaCard } from '../components/denuncia/DenunciaCard'
import { useConfirmacoes } from '../hooks/useConfirmacoes'
import { DIAS_PADRAO, useDenuncias } from '../hooks/useDenuncias'
import { useLinhas } from '../hooks/useLinhas'
import { TIPO_LABELS, ZONA_COLORS, ZONA_LABELS, type Denuncia, type TipoProblema, type Zona } from '../types'

const POR_PAGINA = 12
const TIPOS = Object.keys(TIPO_LABELS) as TipoProblema[]

const ORDEM_ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'outras']

// Data local no formato yyyy-mm-dd, o mesmo valor do <input type="date">.
function diaLocal(iso: string) {
  const data = new Date(iso)
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

const hoje = () => diaLocal(new Date().toISOString())
// A lista só carrega os últimos DIAS_PADRAO dias; datas anteriores ficariam sempre vazias.
const diaMinimo = () => diaLocal(new Date(Date.now() - DIAS_PADRAO * 24 * 60 * 60 * 1000).toISOString())

export function ListaPage() {
  const { linhas } = useLinhas()
  const { denuncias, loading, error, atualizarDenuncia } = useDenuncias(linhas)
  const {
    confirmadas,
    pendentes: confirmando,
    erro: erroConfirmacao,
    alternar,
  } = useConfirmacoes((id, total) => atualizarDenuncia(id, { confirmacoes: total }))
  const desktop = useDesktop()
  const [filtroStatus, setFiltroStatus] = useState<Denuncia['status'] | 'todos'>('todos')
  const [filtroTipo, setFiltroTipo] = useState<TipoProblema | 'todos'>('todos')
  const [pagina, setPagina] = useState(1)
  const [filtroZona, setFiltroZona] = useState<Zona | 'todas'>('todas')

  const [filtroLinha, setFiltroLinha] = useState('')
  const [filtroDia, setFiltroDia] = useState(hoje)

  const base = denuncias.filter(
    (d) =>
      (filtroZona === 'todas' || (d.linha?.zona ?? 'outras') === filtroZona) &&
      (!filtroLinha || d.linha_id === filtroLinha) &&
      (!filtroDia || diaLocal(d.created_at) === filtroDia)
  )
  const filtradas = base.filter(
    (d) => (filtroStatus === 'todos' || d.status === filtroStatus) && (filtroTipo === 'todos' || d.tipo === filtroTipo)
  )
  const pendentes = base.filter((d) => d.status === 'pendente').length
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * POR_PAGINA
  const visiveis = desktop ? filtradas.slice(inicio, inicio + POR_PAGINA) : filtradas

  return (
    <AppLayout title="Denúncias">
      {desktop ? (
        <div className="px-4 pt-0 lg:px-0">
          <CabecalhoPagina titulo="Denúncias" subtitulo="Tudo que foi registrado por quem pega ônibus em Teresina" />
        </div>
      ) : (
      <section className="relative h-[170px] overflow-hidden border-b-[3px] border-brand-green bg-brand-green lg:border-[3px] lg:shadow-[4px_4px_0_#052d00]">
        <img
          src="/brand/onibus-bandeira.svg"
          alt=""
          aria-hidden="true"
          className="tom-sobre-tom absolute -bottom-3.5 -right-16 w-[330px] max-w-none"
        />
        <div className="relative flex flex-col gap-2 p-5 text-brand-cream">
          <h2 className="ttl text-4xl">Denúncias</h2>
          <p className="max-w-[220px] text-sm font-medium leading-snug">
            Ônibus quebrados avisados por quem usa o transporte todo dia.
          </p>
        </div>
      </section>
      )}
      <div className="space-y-4 p-4 lg:px-0">
        <div className="sem-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filtrar por zona">
          <button
            type="button"
            onClick={() => setFiltroZona('todas')}
            aria-pressed={filtroZona === 'todas'}
            className={`chip-brand ${filtroZona === 'todas' ? 'chip-brand-ativo' : ''}`}
          >
            Todas
          </button>
          {ORDEM_ZONAS.map((zona) => (
            <button
              key={zona}
              type="button"
              onClick={() => setFiltroZona(zona)}
              aria-pressed={filtroZona === zona}
              className={`chip-brand ${filtroZona === zona ? 'chip-brand-ativo' : ''}`}
            >
              <i
                className="block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ZONA_COLORS[zona] }}
              />
              {ZONA_LABELS[zona]}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <LinhaSelect
              linhas={linhas}
              value={filtroLinha}
              onChange={setFiltroLinha}
              placeholder="Todas as linhas"
              listaLarga
            />
          </div>
          <div className="w-[9.5rem] shrink-0">
            <input
              type="date"
              min={diaMinimo()}
              max={hoje()}
              aria-label="Filtrar por dia"
              value={filtroDia}
              onChange={(e) => setFiltroDia(e.target.value)}
              className="input-brand min-w-0"
            />
          </div>
        </div>
        {desktop && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex flex-wrap gap-2" aria-label="Filtrar por status">
              {([
                ['todos', `Todas · ${base.length}`],
                ['pendente', `Pendentes · ${pendentes}`],
                ['resolvido', `Resolvidas · ${base.length - pendentes}`],
              ] as const).map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={filtroStatus === valor}
                  onClick={() => {
                    setFiltroStatus(valor)
                    setPagina(1)
                  }}
                  className={`chip-brand ${filtroStatus === valor ? 'chip-brand-ativo' : ''}`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Filtrar por tipo de problema">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={filtroTipo === t}
                  onClick={() => {
                    setFiltroTipo(filtroTipo === t ? 'todos' : t)
                    setPagina(1)
                  }}
                  className={`chip-brand ${filtroTipo === t ? 'chip-brand-ativo' : ''}`}
                >
                  {TIPO_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        )}
        {(filtroLinha || filtroDia) && (
          <button
            type="button"
            className="text-sm font-bold text-brand-green underline"
            onClick={() => {
              setFiltroLinha('')
              setFiltroDia('')
            }}
          >
            Limpar filtros de linha e dia
          </button>
        )}

        {error && <p className="text-center text-sm text-zona-leste">{error}</p>}

        {erroConfirmacao && <p className="text-center text-sm text-zona-leste">{erroConfirmacao}</p>}

        {loading && <p className="text-center text-brand-green-dark/70">Carregando...</p>}

        {!loading && !error && filtradas.length === 0 && (
          <p className="py-10 text-center text-brand-green-dark/70">
            Nenhuma denúncia encontrada.
          </p>
        )}

        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
          {visiveis.map((denuncia) => (
            <DenunciaCard
              key={denuncia.id}
              denuncia={denuncia}
              actions={
                <BotaoTambemVi
                  total={denuncia.confirmacoes ?? 0}
                  confirmado={confirmadas.has(denuncia.id)}
                  carregando={confirmando.has(denuncia.id)}
                  onClick={() => alternar(denuncia.id)}
                />
              }
            />
          ))}
        </div>
        {desktop && (
          <RodapeTabela
            inicio={inicio + 1}
            fim={inicio + visiveis.length}
            total={filtradas.length}
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            onChange={setPagina}
          />
        )}
      </div>
    </AppLayout>
  )
}
