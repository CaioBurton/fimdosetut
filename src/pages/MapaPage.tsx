import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DenunciaRapida } from '../components/denuncia/DenunciaRapida'
import { BotaoCompartilharDenuncia } from '../components/denuncia/BotaoCompartilharDenuncia'
import { BotaoTambemVi } from '../components/denuncia/BotaoTambemVi'
import { AppLayout } from '../components/layout/AppLayout'
import { MapaDenuncias, tempoRelativo } from '../components/map/MapaDenuncias'
import { useConfirmacoes } from '../hooks/useConfirmacoes'
import { DIAS_PADRAO, useDenuncias } from '../hooks/useDenuncias'
import { useDesktop } from '../hooks/useDesktop'
import { useLinhas } from '../hooks/useLinhas'
import { diaLocal, diaMinimoMapa, hoje } from '../lib/dia'
import { STATUS_LABELS, TIPO_LABELS, ZONA_COLORS, ZONA_LABELS, type Denuncia, type Zona } from '../types'

const ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'timon', 'outras']

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function MapaPage() {
  const desktop = useDesktop()
  // Vindo do "Ver no mapa" da lista: a denúncia a destacar (mesmo que seja de outro dia).
  const estado = useLocation().state as { denunciaId?: string; dia?: string } | null
  const focoId = estado?.denunciaId
  const { linhas } = useLinhas()
  // O mapa busca só o dia escolhido (e não as últimas duas semanas). O "Ver no mapa" da lista já
  // abre no dia da denúncia, mesmo que não seja hoje.
  const [dia, setDia] = useState(() =>
    estado?.dia && /^\d{4}-\d{2}-\d{2}$/.test(estado.dia) && estado.dia >= diaMinimoMapa() && estado.dia <= hoje()
      ? estado.dia
      : hoje()
  )
  const { denuncias: todas, loading, atualizando, error, atualizarDenuncia } = useDenuncias(linhas, DIAS_PADRAO, false, dia)
  const {
    confirmadas,
    pendentes: confirmando,
    erro: erroConfirmacao,
    alternar,
  } = useConfirmacoes((id, total) => atualizarDenuncia(id, { confirmacoes: total }))
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<Denuncia['status'] | 'todas'>('todas')

  const denuncias = useMemo(
    () => todas.filter((d) => diaLocal(d.created_at) === dia || d.id === focoId),
    [todas, dia, focoId]
  )

  // No desktop, a busca por linha e o filtro de status ficam sobre o mapa.
  const visiveis = useMemo(() => {
    if (!desktop) return denuncias
    const termo = normalizar(busca.trim())
    return denuncias.filter(
      (d) =>
        d.id === focoId ||
        ((status === 'todas' || d.status === status) &&
        (!termo || normalizar(`${d.linha?.codigo ?? ''} ${d.linha?.nome ?? ''}`).includes(termo)))
    )
  }, [denuncias, desktop, busca, status, focoId])

  // Avisos de erro: no celular, faixa na largura toda sob o cabeçalho; no desktop, um aviso sobre o mapa
  // que deixa livre o painel lateral (onde ficam as linhas favoritas), em vez de cobri-lo.
  const classeAviso = desktop
    ? 'absolute left-6 right-[404px] top-[84px] mx-auto w-fit max-w-[calc(100%-440px)] border-2 border-brand-green bg-zona-leste px-4 py-2.5 text-center text-sm font-bold text-white shadow-[3px_3px_0_#084400]'
    : 'absolute top-16 w-full bg-zona-leste px-4 py-2 text-center text-sm text-white'

  return (
    <AppLayout title="Deu o Prego!" noScroll>
      {error && (
        <div className={`${classeAviso} z-20`}>
          {error}
        </div>
      )}
      {erroConfirmacao && (
        <div role="alert" className={`${classeAviso} anim-abre z-[600]`}>
          {erroConfirmacao}
        </div>
      )}
      {loading ? (
        <div className="flex h-full items-center justify-center text-brand-green-dark">
          Carregando mapa...
        </div>
      ) : (
        <div className="flex h-full">
          <div className="relative min-w-0 flex-1">
            {atualizando && (
              <div
                role="status"
                className="card-brand anim-abre pointer-events-none absolute bottom-4 left-1/2 z-[600] -translate-x-1/2 !bg-brand-cream px-4 py-2 text-sm font-bold"
              >
                Carregando o dia...
              </div>
            )}
            <MapaDenuncias
              denuncias={visiveis}
              semFiltroZona={desktop}
              focoId={focoId}
              seletorDia={{ dia, onChange: setDia, min: diaMinimoMapa(), max: hoje() }}
              acoesSelecionada={(d) => (
                <>
                  <BotaoTambemVi
                    total={d.confirmacoes ?? 0}
                    confirmado={confirmadas.has(d.id)}
                    carregando={confirmando.has(d.id)}
                    onClick={() => alternar(d.id)}
                  />
                  <BotaoCompartilharDenuncia denuncia={d} />
                </>
              )}
            />
            {!desktop && (
              <div className="absolute inset-x-3 top-[60px] z-[600]">
                <DenunciaRapida linhas={linhas} />
              </div>
            )}
            {desktop && (
              <>
                <div className="absolute left-6 right-6 top-6 z-[500] flex flex-wrap items-center gap-3">
                  <div className="card-brand relative max-w-[360px] flex-[1_1_260px] !shadow-[3px_3px_0_#084400]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="pointer-events-none absolute left-3 top-[13px]" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-4-4" />
                    </svg>
                    <input
                      type="search"
                      aria-label="Filtrar por linha"
                      placeholder="Filtrar por linha"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="min-h-[46px] w-full bg-transparent pl-10 pr-3 text-base text-brand-green-dark outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2" aria-label="Filtrar por status">
                    {([
                      ['todas', 'Todas'],
                      ['pendente', 'Pendentes'],
                      ['resolvido', 'Resolvidas'],
                    ] as const).map(([valor, rotulo]) => (
                      <button
                        key={valor}
                        type="button"
                        aria-pressed={status === valor}
                        onClick={() => setStatus(valor)}
                        className={`chip-brand !min-h-10 ${status === valor ? 'chip-brand-ativo' : ''}`}
                      >
                        {rotulo}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="card-brand absolute bottom-6 left-6 z-[500] flex flex-wrap gap-3.5 px-4 py-3 text-[13px] font-bold">
                  {ZONAS.map((z) => (
                    <span key={z} className="flex items-center gap-1.5 text-[#2f5a28]">
                      <i className="block h-3 w-3 rounded-full" style={{ backgroundColor: ZONA_COLORS[z] }} />
                      {ZONA_LABELS[z]}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          {desktop && (
            <aside
              aria-label="Denúncias recentes"
              className="flex w-[380px] shrink-0 flex-col gap-4 overflow-y-auto border-l-[3px] border-brand-green bg-brand-cream p-6"
            >
              <DenunciaRapida linhas={linhas} />
              <div>
                <h2 className="ttl text-[32px] leading-[0.95]">Denúncias recentes</h2>
                <p className="mt-1.5 text-sm font-medium text-[#2f5a28]">Atualiza em tempo real</p>
              </div>
              {visiveis.length === 0 && (
                <p className="py-6 text-center text-brand-green-dark/70">{dia === hoje() ? 'Nenhuma denúncia hoje.' : 'Nenhuma denúncia neste dia.'}</p>
              )}
              {visiveis.map((d) => {
                const zona = d.linha?.zona ?? 'outras'
                return (
                  <article key={d.id} className="card-brand flex items-center gap-2.5 p-3 !shadow-[3px_3px_0_#084400]">
                    <span className="ttl bg-brand-green px-2 py-1.5 text-[15px] leading-none text-brand-cream">
                      {d.linha?.codigo ?? '—'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold leading-tight">{TIPO_LABELS[d.tipo]}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-[#2f5a28]">
                        <i className="block h-[9px] w-[9px] rounded-full" style={{ backgroundColor: ZONA_COLORS[zona] }} />
                        Zona {ZONA_LABELS[zona]} · {tempoRelativo(d.created_at)}
                      </p>
                    </div>
                    <span className="rounded-[2px] border-2 border-brand-green px-2 py-1 text-xs font-bold">
                      {STATUS_LABELS[d.status]}
                    </span>
                  </article>
                )
              })}
              <Link to="/denuncias" className="text-sm font-bold underline">
                Ver todas →
              </Link>
            </aside>
          )}
        </div>
      )}
    </AppLayout>
  )
}
