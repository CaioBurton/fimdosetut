import { usePainelParadas } from '../../hooks/usePainelParadas'
import { PERIODO_LABELS, type Periodo } from '../../lib/dashboardDenuncias'
import { TIPO_LABELS } from '../../types'
import { IconeTipo } from '../denuncia/TipoSelect'
import { IconeParada } from '../ui/IconeParada'
import { TituloSecao } from '../ui/TituloSecao'
import { ResumoContagem } from './ResumoContagem'

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

/**
 * Seção "Paradas" do painel público: quantas denúncias de parada há no período e quais problemas
 * mais aparecem. Segue o período escolhido no painel; o filtro de zona não vale aqui, porque
 * parada não tem zona (só o ponto marcado no mapa).
 */
export function PainelParadas({ periodo }: { periodo: Periodo }) {
  const { resumo, loading, error } = usePainelParadas(periodo)
  const max = Math.max(1, ...resumo.porTipo.map((t) => t.total))
  const vazio = !loading && !error && resumo.total === 0

  return (
    <section
      aria-labelledby="painel-paradas"
      className={`transition-opacity ${loading ? 'opacity-60' : ''}`}
      aria-busy={loading}
    >
      <TituloSecao
        id="painel-paradas"
        dica="Denúncias de problemas em paradas de ônibus: abrigo, banco, placa, sujeira, iluminação, segurança e acessibilidade. Segue o período escolhido acima. O filtro de zona vale só para ônibus."
      >
        Paradas
      </TituloSecao>

      {error && (
        <p role="alert" className="text-sm font-semibold text-zona-leste">
          {error}
        </p>
      )}

      {vazio && (
        <p className="card-brand p-3.5 text-sm font-medium">
          Ainda não há denúncias de parada em “{periodo === 'todos' ? 'Tudo' : PERIODO_LABELS[periodo]}”.
          Elas aparecem aqui quando alguém denuncia em <strong>Reportar → Parada</strong>.
        </p>
      )}

      {!error && resumo.total > 0 && (
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
          <ResumoContagem
            rotulo="Resumo das paradas"
            total={resumo.total}
            pendentes={resumo.pendentes}
            resolvidas={resumo.resolvidas}
            hoje={resumo.hoje}
          />

          <section className="card-brand p-3.5 lg:col-span-2 lg:p-5" aria-label="Problemas mais citados nas paradas">
            <h3 className="ttl mb-3 flex items-center gap-2 text-lg">
              <IconeParada tamanho={18} />
              Problemas mais citados
            </h3>
            <ul className="space-y-3">
              {resumo.porTipo.map((t, n) => (
                <li key={t.chave} className="text-[13px]">
                  <div className="mb-1 flex justify-between gap-2 font-bold">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <IconeTipo tipo={t.chave} />
                      <span className="truncate">{TIPO_LABELS[t.chave]}</span>
                    </span>
                    <span>{t.total}</span>
                  </div>
                  <div
                    className="h-2.5 border border-brand-green bg-[#e3f2da]"
                    role="img"
                    aria-label={`${TIPO_LABELS[t.chave]}: ${plural(t.total, 'denúncia', 'denúncias')}`}
                  >
                    <div
                      className="barra-x h-full bg-brand-green"
                      style={{ width: `${(t.total / max) * 100}%`, animationDelay: `${200 + n * 70}ms` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </section>
  )
}
