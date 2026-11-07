import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CabecalhoPagina } from '../components/ui/CabecalhoPagina'
import { Paginacao } from '../components/ui/Paginacao'
import { RodapeTabela } from '../components/admin/TabelaAdmin'
import { useDesktop } from '../hooks/useDesktop'
import { AppLayout } from '../components/layout/AppLayout'
import { TipoFiltroSelect, type FiltroTipo } from '../components/denuncia/TipoFiltroSelect'
import { LinhaSelect } from '../components/denuncia/LinhaSelect'
import { BotaoTambemVi } from '../components/denuncia/BotaoTambemVi'
import { BotaoCompartilharDenuncia } from '../components/denuncia/BotaoCompartilharDenuncia'
import { DenunciaCard } from '../components/denuncia/DenunciaCard'
import { useConfirmacoes } from '../hooks/useConfirmacoes'
import { DIAS_PADRAO, useDenuncias } from '../hooks/useDenuncias'
import { diaLocal, diaMinimoMapa, hoje } from '../lib/dia'
import { useLinhas } from '../hooks/useLinhas'
import { ehAcessibilidade, TIPO_LABELS, ZONA_COLORS, ZONA_LABELS, type Denuncia, type TipoProblema, type Zona } from '../types'

const POR_PAGINA = 12

const ORDEM_ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'timon', 'rural', 'outras']


export function ListaPage() {
  const { linhas } = useLinhas()
  const [filtroDia, setFiltroDia] = useState(hoje)
  // Com um dia escolhido, baixa SÓ as denúncias dele (como o mapa), em vez das últimas duas semanas.
  const { denuncias, loading, atualizando, error, atualizarDenuncia } = useDenuncias(
    linhas,
    DIAS_PADRAO,
    false,
    filtroDia
  )
  const {
    confirmadas,
    pendentes: confirmando,
    erro: erroConfirmacao,
    alternar,
  } = useConfirmacoes((id, total) => atualizarDenuncia(id, { confirmacoes: total }))
  const desktop = useDesktop()
  const [filtroStatus, setFiltroStatus] = useState<Denuncia['status'] | 'todos'>('todos')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [pagina, setPagina] = useState(1)
  const [filtroZona, setFiltroZona] = useState<Zona | 'todas'>('todas')

  const [filtroLinha, setFiltroLinha] = useState('')

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
  const visiveis = filtradas.slice(inicio, inicio + POR_PAGINA)

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
            onClick={() => {
              setFiltroZona('todas')
              setPagina(1)
            }}
            aria-pressed={filtroZona === 'todas'}
            className={`chip-brand ${filtroZona === 'todas' ? 'chip-brand-ativo' : ''}`}
          >
            Todas
          </button>
          {ORDEM_ZONAS.map((zona) => (
            <button
              key={zona}
              type="button"
              onClick={() => {
                setFiltroZona(zona)
                setPagina(1)
              }}
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
              onChange={(v) => {
                setFiltroLinha(v)
                setPagina(1)
              }}
              placeholder="Todas as linhas"
              comoFiltro
              listaLarga
            />
          </div>
          <div className="w-[9.5rem] shrink-0">
            <input
              type="date"
              min={diaMinimoMapa()}
              max={hoje()}
              aria-label="Filtrar por dia"
              value={filtroDia}
              onChange={(e) => {
                // Campo apagado no seletor: volta para hoje (a lista sempre busca um dia só).
                setFiltroDia(e.target.value || hoje())
                setPagina(1)
              }}
              className="input-brand min-w-0"
            />
          </div>
        </div>
        {desktop && (
          <div className="flex flex-wrap items-center gap-2">
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
            <TipoFiltroSelect
              value={filtroTipo}
              onChange={(v) => {
                setFiltroTipo(v)
                setPagina(1)
              }}
            />
          </div>
        )}
        {(filtroLinha || filtroDia !== hoje()) && (
          <button
            type="button"
            className="text-sm font-bold text-brand-green underline"
            onClick={() => {
              setFiltroLinha('')
              setFiltroDia(hoje())
              setPagina(1)
            }}
          >
            Limpar filtros de linha e dia
          </button>
        )}

        {error && <p className="text-center text-sm text-zona-leste">{error}</p>}

        {erroConfirmacao && <p className="text-center text-sm text-zona-leste">{erroConfirmacao}</p>}

        {(loading || atualizando) && <p className="text-center text-brand-green-dark/70">Carregando...</p>}

        {!loading && !atualizando && !error && filtradas.length === 0 && (
          <p className="py-10 text-center text-brand-green-dark/70">
            Nenhuma denúncia encontrada.
          </p>
        )}

        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
          {visiveis.map((denuncia, i) => (
            // Entrada em cascata: cada cartão 40 ms depois do anterior (no máximo 8 passos).
            <div key={denuncia.id} className="anim-entra" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
            <DenunciaCard
              denuncia={denuncia}
              actions={
                <>
                  <BotaoTambemVi
                    total={denuncia.confirmacoes ?? 0}
                    confirmado={confirmadas.has(denuncia.id)}
                    carregando={confirmando.has(denuncia.id)}
                    onClick={() => alternar(denuncia.id)}
                  />
                  <Link to="/" state={{ denunciaId: denuncia.id, dia: diaLocal(denuncia.created_at) }} className="chip-brand">
                    Ver no mapa
                  </Link>
                  <BotaoCompartilharDenuncia denuncia={denuncia} />
                </>
              }
            />
            </div>
          ))}
        </div>
        {desktop ? (
          <RodapeTabela
            inicio={inicio + 1}
            fim={inicio + visiveis.length}
            total={filtradas.length}
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            onChange={setPagina}
          />
        ) : (
          <Paginacao pagina={paginaAtual} totalPaginas={totalPaginas} onChange={setPagina} />
        )}
      </div>
    </AppLayout>
  )
}
