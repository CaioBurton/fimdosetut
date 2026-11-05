import { useRankingSemana } from '../../hooks/useRankingSemana'
import type { LinhaEmAlta } from '../../lib/rankingSemana'
import { dadosDaLinhaSemana, gerarCartaoSemana, textoSemana } from '../../lib/cartaoCompartilhavel'
import { BotaoCompartilhar } from '../ui/BotaoCompartilhar'
import { ZONA_COLORS, ZONA_LABELS } from '../../types'

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

function Destaque({ linha }: { linha: LinhaEmAlta }) {
  return (
    <div className="anim-entra flex items-start gap-3">
      <span className="ttl shrink-0 bg-brand-cream px-3 py-2 text-3xl leading-none text-brand-green">{linha.codigo}</span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-tight">{linha.nome}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] font-bold">
          <i className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ZONA_COLORS[linha.zona] }} />
          Zona {ZONA_LABELS[linha.zona]}
        </p>
        <p className="mt-2 text-sm font-medium">
          {plural(linha.denuncias, 'denúncia', 'denúncias')} de {plural(linha.pessoas, 'pessoa', 'pessoas')}
          {linha.confirmacoes > 0 && <> · {plural(linha.confirmacoes, 'confirmação', 'confirmações')}</>}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <BotaoCompartilhar
            rotulo="Compartilhar linha da semana"
            gerar={() => gerarCartaoSemana(linha)}
            nomeArquivo={`deu-o-prego-linha-da-semana-${linha.codigo}.png`}
            titulo="Deu o Prego!"
            texto={textoSemana(dadosDaLinhaSemana(linha))}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * "Linha mais problemática da semana": ranking de linhas (nunca de pessoas) dos últimos 7 dias.
 * Só entram linhas denunciadas por pelo menos 2 pessoas diferentes.
 */
export function LinhaDaSemana() {
  const { linhas, loading, error } = useRankingSemana(3)
  const [primeira, ...outras] = linhas

  return (
    <section
      aria-label="Linha mais problemática da semana"
      className="relative overflow-hidden rounded-[2px] border-2 border-brand-green bg-brand-green p-[18px] text-brand-cream shadow-[4px_4px_0_#052d00]"
    >
      <img
        src="/brand/explosao-contorno.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-1.5 w-[230px] max-w-none opacity-35 brightness-[2.2]"
      />
      <div className="relative space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider">Últimos 7 dias</p>
        <div className="flex items-start gap-2">
          <h2 className="ttl text-3xl">Linha mais problemática da semana</h2>
          <span className="group relative mt-1 shrink-0">
            <button
              type="button"
              aria-label="Como funciona"
              aria-describedby="dica-linha-semana"
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand-cream text-xs font-bold leading-none"
            >
              ?
            </button>
            <span
              id="dica-linha-semana"
              role="tooltip"
              className="pointer-events-none absolute right-0 top-full z-10 mt-2 hidden w-64 max-w-[calc(100vw-6rem)] rounded-[2px] bg-brand-green-dark px-3 py-2 text-left text-xs font-semibold leading-snug text-brand-cream shadow-lg group-hover:block group-focus-within:block"
            >
              Conta as denúncias dos últimos 7 dias. Entram só linhas denunciadas por 2 ou mais pessoas diferentes.
              O ranking é de linhas, não de pessoas.
            </span>
          </span>
        </div>

        {loading && <p className="text-sm font-medium">Carregando...</p>}
        {!loading && error && <p role="alert" className="text-sm font-medium">Não foi possível carregar o ranking.</p>}
        {!loading && !error && !primeira && (
          <p className="text-sm font-medium">
            Ainda não há uma linha em destaque. Ela aparece quando pelo menos 2 pessoas diferentes denunciam a mesma linha.
          </p>
        )}

        {primeira && <Destaque linha={primeira} />}

        {outras.length > 0 && (
          <div className="border-t border-brand-cream/40 pt-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider">Também em alta</p>
            <ol className="space-y-1.5">
              {outras.map((l, i) => (
                <li key={l.linhaId} className="anim-entra flex items-center gap-2 text-sm font-bold" style={{ animationDelay: `${(i + 1) * 60}ms` }}>
                  <span className="ttl w-5 text-brand-cream/70">{i + 2}</span>
                  <span className="ttl bg-brand-cream px-1.5 py-1 text-xs leading-none text-brand-green">{l.codigo}</span>
                  <span className="min-w-0 flex-1 truncate">{l.nome}</span>
                  <span className="shrink-0 text-xs font-semibold">
                    {plural(l.denuncias, 'denúncia', 'denúncias')} · {plural(l.pessoas, 'pessoa', 'pessoas')}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  )
}
