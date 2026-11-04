import { useAuth } from '../../hooks/useAuth'
import { useSelos } from '../../hooks/useSelos'
import { EXPLOSAO_PATH } from '../../lib/marca'
import { montarSelos, type Selo } from '../../lib/selos'
import { TituloSecao } from '../ui/TituloSecao'

function Estrela({ ativa }: { ativa: boolean }) {
  return (
    <svg viewBox="0 0 274 166" width="56" height="34" aria-hidden="true" className={`shrink-0 ${ativa ? 'anim-pop' : ''}`}>
      <path
        d={EXPLOSAO_PATH}
        fill={ativa ? '#084400' : 'none'}
        stroke="#084400"
        strokeWidth={ativa ? 6 : 8}
        strokeDasharray={ativa ? undefined : '14 12'}
        strokeLinejoin="round"
        opacity={ativa ? 1 : 0.45}
      />
    </svg>
  )
}

function Cartao({ selo }: { selo: Selo }) {
  const { progresso } = selo
  return (
    <li className={`card-brand flex items-center gap-3 p-3 ${selo.conquistado ? '' : '!shadow-none opacity-80'}`}>
      <Estrela ativa={selo.conquistado} />
      <div className="min-w-0 flex-1">
        <p className="ttl text-base">{selo.titulo}</p>
        <p className="mt-0.5 text-[13px] font-medium leading-snug text-brand-green-dark/80">{selo.descricao}</p>
        {progresso && (
          <div className="mt-1.5 flex items-center gap-2">
            <div
              role="progressbar"
              aria-label={`Progresso de ${selo.titulo}`}
              aria-valuemin={0}
              aria-valuemax={progresso.meta}
              aria-valuenow={progresso.atual}
              className="h-2 flex-1 border border-brand-green bg-[#e3f2da]"
            >
              <div className="h-full bg-[#307800]" style={{ width: `${(progresso.atual / progresso.meta) * 100}%` }} />
            </div>
            <span className="text-xs font-bold">
              {progresso.atual}/{progresso.meta}
            </span>
          </div>
        )}
      </div>
    </li>
  )
}

/**
 * "Meus selos": reconhecimento leve, só da própria pessoa. Os selos vêm de denúncias que outras
 * pessoas confirmaram, e não de quantas ela enviou, e não há ranking de pessoas.
 */
export function Selos() {
  const { user } = useAuth()
  const { dados, loading, error } = useSelos(user?.id)

  if (!user) return null

  const selos = montarSelos(dados)
  const conquistados = selos.filter((s) => s.conquistado)
  const aCaminho = selos.filter((s) => !s.conquistado)

  return (
    <section aria-label="Meus selos" className="space-y-3">
      <TituloSecao
        dica={
          <>
            Só você vê estes selos. Eles nascem de denúncias que outras pessoas confirmaram com “Também vi”,
            e não de quantas você enviou. Não existe ranking de pessoas.
          </>
        }
      >
        Meus selos
      </TituloSecao>

      {error && <p role="alert" className="text-sm font-semibold text-zona-leste">{error}</p>}
      {loading && <p className="text-sm text-brand-green-dark/60">Carregando...</p>}

      {!loading && !error && (
        <>
          <p className="text-sm font-bold">
            {dados.sequenciaAtual > 0
              ? `Sequência atual: ${dados.sequenciaAtual} ${dados.sequenciaAtual === 1 ? 'dia' : 'dias'} colaborando`
              : 'Colabore hoje para começar uma sequência.'}
          </p>
          {conquistados.length > 0 && (
            <ul className="space-y-2.5" aria-label="Selos conquistados">
              {conquistados.map((s) => (
                <Cartao key={s.id} selo={s} />
              ))}
            </ul>
          )}
          {aCaminho.length > 0 && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-wide text-brand-green-dark/70">A caminho</h3>
              <ul className="space-y-2.5" aria-label="Selos a caminho">
                {aCaminho.map((s) => (
                  <Cartao key={s.id} selo={s} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  )
}
