import type { ReactNode } from 'react'
import { useDesktop } from '../../hooks/useDesktop'
import { BotaoCompartilhar } from '../ui/BotaoCompartilhar'
import { BotaoCompartilharPainel } from '../ui/BotaoCompartilharPainel'
import { BotaoCompartilharTudo } from '../ui/BotaoCompartilharTudo'
import {
  dadosDaAcessibilidade,
  dadosDoRanking,
  dadosDoResumo,
  dadosPorDia,
  dadosPorTipo,
  dadosPorZona,
  gerarCartaoRanking,
  textoRanking,
  type DadosCartaoPainel,
} from '../../lib/cartaoCompartilhavel'
import { PERIODO_LABELS, type Periodo } from '../../lib/dashboardDenuncias'
import { taxaResolucao, type ResumoPainel } from '../../lib/resumoPainel'
import { TIPO_LABELS, ZONA_COLORS, ZONA_LABELS, type Zona } from '../../types'

const ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'timon', 'rural', 'outras']
const PERIODOS: Periodo[] = ['30d', 'todos', '7d']

const atraso = (i: number) => ({ animationDelay: `${Math.min(i, 8) * 60}ms` })

function Kpi({ rotulo, valor, cor, ordem = 0 }: { rotulo: string; valor: string | number; cor?: string; ordem?: number }) {
  return (
    <div className="card-brand anim-entra p-3" style={atraso(ordem)}>
      <p className="text-xs font-bold uppercase tracking-wide text-brand-green-dark/70">{rotulo}</p>
      <p key={valor} className="ttl anim-contador text-3xl" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
    </div>
  )
}

function Barras({
  titulo,
  itens,
  ordem = 0,
  compartilhar,
  arquivo,
}: {
  titulo: string
  itens: { rotulo: string; total: number; cor: string }[]
  ordem?: number
  compartilhar: DadosCartaoPainel
  arquivo: string
}) {
  const max = Math.max(1, ...itens.map((i) => i.total))
  return (
    <section className="card-brand anim-entra p-3.5" style={atraso(ordem)} aria-label={titulo}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="ttl text-lg">{titulo}</h3>
        <BotaoCompartilharPainel dados={compartilhar} arquivo={arquivo} />
      </div>
      {itens.length === 0 ? (
        <p className="text-sm text-brand-green-dark/70">Sem dados.</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((i, n) => (
            <li key={i.rotulo} className="text-[13px]">
              <div className="mb-1 flex justify-between gap-2 font-bold">
                <span className="flex items-center gap-1.5 truncate">
                  <i className="block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: i.cor }} />
                  {i.rotulo}
                </span>
                <span>{i.total}</span>
              </div>
              <div className="h-2.5 border border-brand-green bg-[#e3f2da]">
                <div className="barra-x h-full" style={{ width: `${(i.total / max) * 100}%`, backgroundColor: i.cor, animationDelay: `${200 + n * 70}ms` }} />
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
  /** Conteúdo extra logo abaixo do gráfico "Por dia" (usado no painel público). */
  aposPorDia?: ReactNode
  /** Falso: não mostra os botões Semanal/Diário no fim (a página os coloca em outro lugar). */
  botoesCompartilhar?: boolean
}

export function PainelConteudo({
  resumo,
  periodo,
  zona,
  onPeriodo,
  onZona,
  onGerenciarLinhas,
  carregando = false,
  aposPorDia,
  botoesCompartilhar = true,
}: Props) {
  const desktop = useDesktop()
  const porDia = resumo.porDia
  const maxDia = Math.max(1, ...porDia.map((d) => d.total))
  const maxLinha = Math.max(1, ...resumo.topLinhas.map((l) => l.total))
  const taxa = taxaResolucao(resumo)
  const acess = resumo.acessibilidade
  const dadosResumo = dadosDoResumo(resumo, periodo, zona)
  const dadosZona = dadosPorZona(resumo, periodo, zona)
  const dadosTipo = dadosPorTipo(resumo, periodo, zona)

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
        className="anim-entra relative overflow-hidden rounded-[2px] border-2 border-brand-green bg-brand-green p-[18px] text-brand-cream shadow-[4px_4px_0_#052d00]"
      >
        <img
          src="/brand/explosao-contorno.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-1.5 w-[230px] max-w-none opacity-35 brightness-[2.2]"
        />
        <div className="absolute right-3 top-3 z-10">
          <BotaoCompartilharPainel dados={dadosResumo} arquivo="resumo" />
        </div>
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-wider">Pendentes agora</p>
          <p key={resumo.pendentes} className="ttl anim-contador mt-1 text-7xl">{resumo.pendentes}</p>
          <p className="mt-1.5 text-sm font-medium">
            de {resumo.total} {resumo.total === 1 ? 'denúncia' : 'denúncias'} no período
          </p>
          <div className="mt-3.5 h-3 border border-brand-cream bg-brand-green-dark">
            <div className="barra-x h-full bg-brand-cream" style={{ width: `${taxa}%`, animationDelay: '250ms' }} />
          </div>
          <p className="mt-1.5 text-[13px] font-bold">{taxa}% resolvidas</p>
        </div>
      </section>
      )}

      {desktop ? (
        <section aria-label="Resumo" className="lg:col-span-2">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="ttl text-lg">Resumo</h3>
            <BotaoCompartilharPainel dados={dadosResumo} arquivo="resumo" />
          </div>
          <div className="grid grid-cols-4 gap-5">
            <Kpi rotulo="Total" valor={resumo.total} ordem={0} />
            <Kpi rotulo="Pendentes" valor={resumo.pendentes} cor="#c23838" ordem={1} />
            <Kpi rotulo="Resolvidas" valor={resumo.resolvidas} ordem={2} />
            <Kpi rotulo="Hoje" valor={resumo.hoje} ordem={3} />
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-3 gap-2.5">
          <Kpi rotulo="Total" valor={resumo.total} ordem={1} />
          <Kpi rotulo="Resolvidas" valor={resumo.resolvidas} ordem={2} />
          <Kpi rotulo="Hoje" valor={resumo.hoje} cor="#c23838" ordem={3} />
        </section>
      )}

      <section className="card-brand anim-entra p-3.5 lg:self-stretch lg:p-5" style={atraso(4)} aria-label="Denúncias por dia">
        <div className="flex items-baseline justify-between">
          <h3 className="ttl text-lg">Por dia</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-green-dark/70">últimos {porDia.length} dias</span>
            <BotaoCompartilharPainel dados={dadosPorDia(resumo, zona)} arquivo="por-dia" />
          </div>
        </div>
        <div className="mt-3.5 flex h-[130px] items-end gap-1 border-b-2 border-brand-green lg:h-[170px]">
          {porDia.map((d, i) => (
            <div key={d.data.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-0.5 text-[11px] font-bold">{d.total}</span>
              <div
                className="barra-y w-full"
                style={{
                  animationDelay: `${250 + i * 25}ms`,
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

      {aposPorDia && <div className="lg:self-stretch">{aposPorDia}</div>}

      <Barras
        titulo="Por zona"
        ordem={5}
        compartilhar={dadosZona}
        arquivo="por-zona"
        itens={resumo.porZona.map((i) => ({
          rotulo: ZONA_LABELS[i.chave],
          total: i.total,
          cor: ZONA_COLORS[i.chave],
        }))}
      />
      <Barras
        titulo="Por tipo de problema"
        ordem={6}
        compartilhar={dadosTipo}
        arquivo="por-tipo"
        itens={resumo.porTipo.map((i) => ({ rotulo: TIPO_LABELS[i.chave], total: i.total, cor: '#084400' }))}
      />

      <section
        className="card-brand anim-entra p-3.5 lg:col-span-2 lg:p-5"
        style={atraso(7)}
        aria-label="Acessibilidade (PcD)"
      >
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="ttl text-lg">Acessibilidade (PcD)</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-green-dark/70">
              {acess.total} {acess.total === 1 ? 'ocorrência' : 'ocorrências'} · {acess.pendentes}{' '}
              {acess.pendentes === 1 ? 'pendente' : 'pendentes'}
            </span>
            <BotaoCompartilharPainel dados={dadosDaAcessibilidade(resumo, periodo, zona)} arquivo="acessibilidade" />
          </div>
        </div>
        {acess.total === 0 ? (
          <p className="mt-2 text-sm text-brand-green-dark/70">
            Nenhum problema de acessibilidade registrado no período.
          </p>
        ) : (
          <div className="mt-3 space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-green-dark/70">
                Linhas com mais ocorrências
              </h4>
              <ul className="space-y-2 text-[13px]">
                {acess.topLinhas.map((l) => (
                  <li key={l.linhaId || l.nome} className="flex items-center justify-between gap-2 font-bold">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="ttl bg-brand-green px-1.5 py-1 text-xs leading-none text-brand-cream">{l.codigo}</span>
                      <span className="truncate">{l.nome}</span>
                    </span>
                    <span>{l.total}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-green-dark/70">
                Veículos com mais ocorrências
              </h4>
              {acess.topVeiculos.length === 0 ? (
                <p className="text-[13px] text-brand-green-dark/70">Nenhuma denúncia informou o número do veículo.</p>
              ) : (
                <ul className="space-y-2 text-[13px]">
                  {acess.topVeiculos.map((v) => (
                    <li key={v.numero} className="flex justify-between gap-2 font-bold">
                      <span className="truncate">Veículo {v.numero}</span>
                      <span>{v.total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>


      <section className="card-brand anim-entra overflow-hidden lg:col-span-2" style={atraso(8)} aria-label="Linhas com mais denúncias">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 pb-2.5 pt-3.5">
          <h3 className="ttl text-lg">Linhas com mais denúncias</h3>
          {resumo.topLinhas.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <BotaoCompartilhar
                rotulo="Compartilhar ranking"
                gerar={() => gerarCartaoRanking(resumo, periodo, zona)}
                nomeArquivo="deu-o-prego-ranking.png"
                titulo="Deu o Prego!"
                texto={textoRanking(dadosDoRanking(resumo, periodo, zona))}
              />
            </div>
          )}
        </div>
        {resumo.topLinhas.length === 0 ? (
          <p className="px-3.5 pb-3.5 text-sm text-brand-green-dark/70">Sem dados.</p>
        ) : (
          <ol className="lg:grid lg:grid-cols-2 lg:gap-x-7">
            {resumo.topLinhas.map((l, i) => {
              return (
                <li key={`${l.linhaId}-${i}`} className="anim-entra flex items-center gap-3 border-t border-[#cfe3c6] px-3.5 py-2.5" style={{ animationDelay: `${450 + i * 50}ms` }}>
                  <span className="ttl w-5 text-lg text-[#307800]">{i + 1}</span>
                  <span className="ttl bg-brand-green px-2 py-1.5 text-[15px] leading-none text-brand-cream">
                    {l.codigo}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{l.nome}</p>
                    <div className="mt-1.5 h-2 border border-brand-green bg-[#e3f2da]">
                      <div className="barra-x h-full bg-[#307800]" style={{ width: `${(l.total / maxLinha) * 100}%`, animationDelay: `${550 + i * 50}ms` }} />
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

      {botoesCompartilhar && (
        <div className="lg:col-span-2">
          <BotaoCompartilharTudo />
        </div>
      )}
    </div>
  )
}
