import type { ReactNode } from 'react'
import { useDesktop } from '../../hooks/useDesktop'

const atraso = (i: number) => ({ animationDelay: `${Math.min(i, 8) * 60}ms` })

export function Kpi({ rotulo, valor, cor, ordem = 0 }: { rotulo: string; valor: string | number; cor?: string; ordem?: number }) {
  return (
    <div className="card-brand anim-entra p-3" style={atraso(ordem)}>
      <p className="text-xs font-bold uppercase tracking-wide text-brand-green-dark/70">{rotulo}</p>
      <p key={valor} className="ttl anim-contador text-3xl" style={cor ? { color: cor } : undefined}>
        {valor}
      </p>
    </div>
  )
}

interface Props {
  total: number
  pendentes: number
  resolvidas: number
  /** Denúncias de hoje. */
  hoje: number
  /** Nome da região (leitores de tela) e título do bloco no desktop. */
  rotulo?: string
  /** Botão de compartilhar, no canto do cartão (mobile) ou ao lado do título (desktop). */
  acao?: ReactNode
}

/**
 * Contador do painel: no celular, o cartão verde "Pendentes agora" com a barra de resolvidas e os
 * três números; no desktop, o bloco "Resumo" com quatro números. É o mesmo para ônibus e paradas.
 */
export function ResumoContagem({ total, pendentes, resolvidas, hoje, rotulo = 'Resumo', acao }: Props) {
  const desktop = useDesktop()
  const taxa = total === 0 ? 0 : Math.round((resolvidas / total) * 100)

  return (
    <>
      {!desktop && (
        <section
          aria-label={rotulo}
          className="anim-entra relative overflow-hidden rounded-[2px] border-2 border-brand-green bg-brand-green p-[18px] text-brand-cream shadow-[4px_4px_0_#052d00]"
        >
          <img
            src="/brand/explosao-contorno.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-1.5 w-[230px] max-w-none opacity-35 brightness-[2.2]"
          />
          {acao && <div className="absolute right-3 top-3 z-10">{acao}</div>}
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-wider">Pendentes agora</p>
            <p key={pendentes} className="ttl anim-contador mt-1 text-7xl">{pendentes}</p>
            <p className="mt-1.5 text-sm font-medium">
              de {total} {total === 1 ? 'denúncia' : 'denúncias'} no período
            </p>
            <div className="mt-3.5 h-3 border border-brand-cream bg-brand-green-dark">
              <div className="barra-x h-full bg-brand-cream" style={{ width: `${taxa}%`, animationDelay: '250ms' }} />
            </div>
            <p className="mt-1.5 text-[13px] font-bold">{taxa}% resolvidas</p>
          </div>
        </section>
      )}

      {desktop ? (
        <section aria-label={rotulo} className="lg:col-span-2">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h3 className="ttl text-lg">{rotulo}</h3>
            {acao}
          </div>
          <div className="grid grid-cols-4 gap-5">
            <Kpi rotulo="Total" valor={total} ordem={0} />
            <Kpi rotulo="Pendentes" valor={pendentes} cor="#c23838" ordem={1} />
            <Kpi rotulo="Resolvidas" valor={resolvidas} ordem={2} />
            <Kpi rotulo="Hoje" valor={hoje} ordem={3} />
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-3 gap-2.5">
          <Kpi rotulo="Total" valor={total} ordem={1} />
          <Kpi rotulo="Resolvidas" valor={resolvidas} ordem={2} />
          <Kpi rotulo="Hoje" valor={hoje} cor="#c23838" ordem={3} />
        </section>
      )}
    </>
  )
}
