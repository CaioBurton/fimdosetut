import { useState } from 'react'
import type { Periodo } from '../../lib/dashboardDenuncias'
import { usePainelResumo } from '../../hooks/usePainelResumo'
import type { Zona } from '../../types'
import { DenunciasPorHora } from '../painel/DenunciasPorHora'
import { LinhaDaSemana } from '../painel/LinhaDaSemana'
import { PainelConteudo } from './PainelConteudo'

interface Props {
  onGerenciarLinhas: () => void
}

/**
 * Painel do admin: os números vêm do resumo calculado no banco (como no painel público), então não
 * baixa as denúncias e "Tudo" mostra o histórico completo.
 */
export function PainelAdmin({ onGerenciarLinhas }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>('todos')
  const [zona, setZona] = useState<Zona | 'todas'>('todas')
  const { resumo, loading, error } = usePainelResumo(periodo, zona)

  return (
    <div className="-mb-6 space-y-5 lg:mb-0">
      {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
      <LinhaDaSemana />
      <PainelConteudo
        resumo={resumo}
        periodo={periodo}
        zona={zona}
        onPeriodo={setPeriodo}
        onZona={setZona}
        onGerenciarLinhas={onGerenciarLinhas}
        carregando={loading}
        aposPorDia={<DenunciasPorHora />}
      />
    </div>
  )
}
