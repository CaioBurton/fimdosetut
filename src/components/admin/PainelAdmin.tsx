import { useMemo, useState } from 'react'
import type { Periodo } from '../../lib/dashboardDenuncias'
import { resumirDenuncias } from '../../lib/resumoPainel'
import type { Denuncia, Zona } from '../../types'
import { PainelConteudo } from './PainelConteudo'

interface Props {
  denuncias: Denuncia[]
  onGerenciarLinhas: () => void
}

/** Painel do admin: calcula o resumo no navegador, com as denúncias já carregadas. */
export function PainelAdmin({ denuncias, onGerenciarLinhas }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>('30d')
  const [zona, setZona] = useState<Zona | 'todas'>('todas')
  const resumo = useMemo(
    () => resumirDenuncias(denuncias, periodo, zona),
    [denuncias, periodo, zona]
  )

  return (
    <PainelConteudo
      resumo={resumo}
      periodo={periodo}
      zona={zona}
      onPeriodo={setPeriodo}
      onZona={setZona}
      onGerenciarLinhas={onGerenciarLinhas}
    />
  )
}
