import { useDesktop } from '../../hooks/useDesktop'
import { PERIODO_LABELS, type Periodo } from '../../lib/dashboardDenuncias'
import { taxaResolucao, type ResumoPainel } from '../../lib/resumoPainel'
import { TIPO_LABELS, ZONA_COLORS, ZONA_LABELS, type Zona } from '../../types'

const ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'outras']
const PERIODOS: Periodo[] = ['7d', '30d', 'todos']

function Kpi({ rotulo, valor, cor }: { rotulo: string; valor: string | number; cor?: string }) {
  return (
    <div className="card-brand p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-green-dark/70">{rotulo}</p>
      <p className="ttl text-3xl" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
    </div>
  )
}

function Barras({
  titulo,
  itens,
}: {
  titulo: string
  itens: { rotulo: string; total: number; cor: string }[]
}) {
  const max = Math.max(1, ...itens.map((i) => i.total))
  return (
    <section className="card-brand p-3.5" aria-label={titulo}>
      <h3 className="ttl mb-3 text-lg">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="text-sm text-brand-green-dark/70">Sem dados.</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((i) => (
            <li key={i.rotulo} className="text-[13px]">
              <div className="mb-1 flex justify-between gap-2 font-bold">
                <span className="flex items-center gap-1.5 truncate">
                  <i className="block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: i.cor }} />
                  {i.rotulo}
                </span>
                <span>{i.total}</span>
              </div>
              <div className="h-2.5 border border-brand-green bg-[#e3f2da]">
                <div className="h-full" style={{ width: `${(i.total / max) * 100}%`, backgroundColor: i.cor }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface Props {
  resumo: ResumoPainel
  periodo: Periodo
  zona: Zona | 'todas'
  onPeriodo: (periodo: Periodo) => void
  onZona: (zona: Zona | 'todas') => void
  /** Atalho para a aba de linhas; só aparece no admin. */
  onGerenciarLinhas?: () => void
  /** Escurece o conteúdo enquanto um novo resumo carrega. */
  carregando?: boolean
}

export function PainelConteudo({
  resumo,
  periodo,
  zona,
  onPeriodo,
  onZona,
  onGerenciarLinhas,
  carregando = false,
}: Props) {
  const desktop = useDesktop()
  const porDia = resumo.porDia
  const maxDia = Math.max(1, ...porDia.map((d) => d.total))
  const maxLinha = Math.max(1, ...resumo.topLinhas.map((l) => l.total))
  const taxa = taxaResolucao(resumo)

  return (
    <div className={`space-y-4 transition-opacity lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0 ${carregando ? 'opacity-60' : ''}`} aria-busy={carregando}>
      <div className="space-y-2.5 lg:col-span-2 lg:flex lg:flex-wrap lg:items-center lg:gap-4 lg:space-y-0">
        <div
          role="group"
          aria-label="Período"
          className="grid grid-cols-3 overflow-hidden rounded-[2px] border-2 border-brand-green lg:w-80"
        >
          {PERIODOS.map((p, i) => (
            <button
              key={p}
              type="button"
              aria-pressed={periodo === p}
              onClick={() => onPeriodo(p)}
              className={`min-h-11 text-sm font-bold ${i > 0 ? 'border-l-2 border-brand-green' : ''} ${
                periodo === p ? 'bg-brand-green text-brand-cream' : 'bg-brand-cream text-brand-green'
              }`}
            >
              {p === 'todos' ? 'Tudo' : PERIODO_LABELS[p].replace('Últimos ', '')}
            </button>
          ))}
        </div>

        <div className="sem-scrollbar flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por zona">
          <button
            type="button"
            aria-pressed={zona === 'todas'}
            onClick={() => onZona('todas')}
            className={`chip-brand ${zona === 'todas' ? 'chip-brand-ativo' : ''}`}
          >
            Todas as zonas
          </button>
          {ZONAS.map((z) => (
            <button
              key={z}
              type="button"
              aria-pressed={zona === z}
              onClick={() => onZona(z)}
              className={`chip-brand ${zona === z ? 'chip-brand-ativo' : ''}`}
            >
              <i className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ZONA_COLORS[z] }} />
              {ZONA_LABELS[z]}
            </button>
          ))}
        </div>
      </div>

      {!desktop && (
      <section
        aria-label="Resumo"
        className="relative overflow-hidden rounded-[2px] border-2 border-brand-green bg-brand-green p-[18px] text-brand-cream shadow-[4px_4px_0_#052d00]"
      >
        <img
          src="/brand/explosao-contorno.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-1.5 w-[230px] max-w-none opacity-35 brightness-[2.2]"
        />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-wider">Pendentes agora</p>
          <p className="ttl mt-1 text-7xl">{resumo.pendentes}</p>
          <p className="mt-1.5 text-sm font-medium">
            de {resumo.total} {resumo.total === 1 ? 'denúncia' : 'denúncias'} no período
          </p>
          <div className="mt-3.5 h-3 border border-brand-cream bg-brand-green-dark">
            <div className="h-full bg-brand-cream" style={{ width: `${taxa}%` }} />
          </div>
          <p className="mt-1.5 text-[13px] font-bold">{taxa}% resolvidas</p>
        </div>
      </section>
      )}

      {desktop ? (
        <section aria-label="Resumo" className="grid grid-cols-4 gap-5 lg:col-span-2">
          <Kpi rotulo="Total" valor={resumo.total} />
          <Kpi rotulo="Pendentes" valor={resumo.pendentes} cor="#c23838" />
          <Kpi rotulo="Resolvidas" valor={resumo.resolvidas} />
          <Kpi rotulo="Hoje" valor={resumo.hoje} />
        </section>
      ) : (
        <section className="grid grid-cols-3 gap-2.5">
          <Kpi rotulo="Total" valor={resumo.total} />
          <Kpi rotulo="Resolvidas" valor={resumo.resolvidas} />
          <Kpi rotulo="Hoje" valor={resumo.hoje} cor="#c23838" />
        </section>
      )}

      <section className="card-brand p-3.5 lg:col-span-2 lg:p-5" aria-label="Denúncias por dia">
        <div className="flex items-baseline justify-between">
          <h3 className="ttl text-lg">Por dia</h3>
          <span className="text-xs font-bold text-brand-green-dark/70">últimos {porDia.length} dias</span>
        </div>
        <div className="mt-3.5 flex h-[130px] items-end gap-1 border-b-2 border-brand-green lg:h-[170px]">
          {porDia.map((d, i) => (
            <div key={d.data.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-0.5 text-[11px] font-bold">{d.total}</span>
              <div
                className="w-full"
                style={{
                  height: `${(d.total / maxDia) * (desktop ? 140 : 100)}px`,
                  backgroundColor: i === porDia.length - 1 ? '#c23838' : '#084400',
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          {porDia.map((d) => (
            <span key={d.data.toISOString()} className="flex-1 text-center text-[11px] font-semibold text-brand-green-dark/70">
              {d.data.getDate()}
            </span>
          ))}
        </div>
      </section>

      <Barras
        titulo="Por zona"
        itens={resumo.porZona.map((i) => ({
          rotulo: ZONA_LABELS[i.chave],
          total: i.total,
          cor: ZONA_COLORS[i.chave],
        }))}
      />
      <Barras
        titulo="Por tipo de problema"
        itens={resumo.porTipo.map((i) => ({ rotulo: TIPO_LABELS[i.chave], total: i.total, cor: '#084400' }))}
      />

      <section className="card-brand overflow-hidden lg:col-span-2" aria-label="Linhas com mais denúncias">
        <h3 className="ttl px-3.5 pb-2.5 pt-3.5 text-lg">Linhas com mais denúncias</h3>
        {resumo.topLinhas.length === 0 ? (
          <p className="px-3.5 pb-3.5 text-sm text-brand-green-dark/70">Sem dados.</p>
        ) : (
          <ol className="lg:grid lg:grid-cols-2 lg:gap-x-7">
            {resumo.topLinhas.map((l, i) => {
              return (
                <li key={`${l.linhaId}-${i}`} className="flex items-center gap-3 border-t border-[#cfe3c6] px-3.5 py-2.5">
                  <span className="ttl w-5 text-lg text-[#307800]">{i + 1}</span>
                  <span className="ttl bg-brand-green px-2 py-1.5 text-[15px] leading-none text-brand-cream">
                    {l.codigo}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{l.nome}</p>
                    <div className="mt-1.5 h-2 border border-brand-green bg-[#e3f2da]">
                      <div className="h-full bg-[#307800]" style={{ width: `${(l.total / maxLinha) * 100}%` }} />
                    </div>
                  </div>
                  <span className="min-w-6 text-right text-base font-extrabold">{l.total}</span>
                </li>
              )
            })}
          </ol>
        )}
        {onGerenciarLinhas && (
          <button
            type="button"
            onClick={onGerenciarLinhas}
            className="flex min-h-12 w-full items-center justify-center border-t-2 border-brand-green text-sm font-bold underline"
          >
            Gerenciar linhas →
          </button>
        )}
      </section>
    </div>
  )
}
