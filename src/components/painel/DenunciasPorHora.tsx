import { useMemo, useState } from 'react'
import { BotaoCalendario } from '../map/BotaoCalendario'
import { useDenuncias } from '../../hooks/useDenuncias'
import { diaMinimoMapa, hoje } from '../../lib/dia'
import type { Linha } from '../../types'

const SEM_LINHAS: Linha[] = []

/** Conta as denúncias por hora do dia (0–23), no horário local. */
export function contarPorHora(datas: string[]) {
  const horas = new Array<number>(24).fill(0)
  for (const iso of datas) horas[new Date(iso).getHours()]++
  return horas
}

/** Gráfico de barras com a quantidade de denúncias feitas ao longo de um dia, hora a hora. */
export function DenunciasPorHora() {
  const [dia, setDia] = useState(hoje)
  const { denuncias, loading, atualizando, error } = useDenuncias(SEM_LINHAS, null, false, dia)
  const horas = useMemo(() => contarPorHora(denuncias.map((d) => d.created_at)), [denuncias])
  const total = horas.reduce((a, b) => a + b, 0)
  const maximo = Math.max(...horas, 1)
  const [ano, mes, d] = dia.split('-')
  const ehHoje = dia === hoje()

  const L = 24 * 20
  const A = 140
  return (
    <section
      aria-label="Denúncias ao longo do dia"
      className="h-full rounded-[2px] border-2 border-brand-green bg-brand-cream p-[18px] text-brand-green shadow-[4px_4px_0_#084400]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="ttl text-2xl">Denúncias ao longo do dia</h2>
          <p className="mt-1 text-sm font-medium">
            {ehHoje ? 'Hoje' : `${d}/${mes}/${ano}`} · {total} {total === 1 ? 'denúncia' : 'denúncias'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BotaoCalendario dia={dia} onChange={setDia} min={diaMinimoMapa()} max={hoje()} />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-center text-sm font-semibold text-zona-leste">
          {error}
        </p>
      ) : (
        <div className={`mt-4 transition-opacity ${loading || atualizando ? 'opacity-50' : ''}`}>
          <svg
            viewBox={`0 0 ${L} ${A + 22}`}
            role="img"
            aria-label={`Denúncias por hora em ${ehHoje ? 'hoje' : `${d}/${mes}/${ano}`}: ${total} no total`}
            className="w-full"
          >
            <line x1="0" y1={A} x2={L} y2={A} stroke="currentColor" strokeWidth="1.5" />
            {horas.map((n, h) => {
              const altura = (n / maximo) * (A - 18)
              return (
                <g key={h}>
                  <title>{`${String(h).padStart(2, '0')}h: ${n} ${n === 1 ? 'denúncia' : 'denúncias'}`}</title>
                  <rect x={h * 20 + 3} y={A - altura} width="14" height={altura} fill="currentColor" />
                  {n > 0 && (
                    <text x={h * 20 + 10} y={A - altura - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">
                      {n}
                    </text>
                  )}
                  {h % 3 === 0 && (
                    <text x={h * 20 + 10} y={A + 15} textAnchor="middle" fontSize="10" fill="currentColor">
                      {h}h
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
          {!loading && total === 0 && <p className="mt-2 text-center text-sm font-medium">Nenhuma denúncia neste dia.</p>}
        </div>
      )}
    </section>
  )
}
