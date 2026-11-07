import { useState } from 'react'
import { CabecalhoPagina } from '../components/ui/CabecalhoPagina'
import { useDesktop } from '../hooks/useDesktop'
import { AppLayout } from '../components/layout/AppLayout'
import { PainelConteudo } from '../components/admin/PainelConteudo'
import { DenunciasPorHora } from '../components/painel/DenunciasPorHora'
import { LinhaDaSemana } from '../components/painel/LinhaDaSemana'
import { usePainelResumo } from '../hooks/usePainelResumo'
import type { Periodo } from '../lib/dashboardDenuncias'
import type { Zona } from '../types'

/** Painel público: números do resumo calculados no banco, sem baixar as denúncias. */
export function PainelPage() {
  const desktop = useDesktop()
  const [periodo, setPeriodo] = useState<Periodo>('hoje')
  const [zona, setZona] = useState<Zona | 'todas'>('todas')
  const { resumo, loading, error } = usePainelResumo(periodo, zona)

  return (
    <AppLayout title="Painel">
      <div className="space-y-5 p-4 lg:p-0">
        {desktop && <CabecalhoPagina titulo="Painel" subtitulo="Como anda o transporte público, segundo quem usa" />}
        {error && (
          <p role="alert" className="text-center text-sm font-semibold text-zona-leste">
            {error}
          </p>
        )}
        <LinhaDaSemana />
        <PainelConteudo
          resumo={resumo}
          periodo={periodo}
          zona={zona}
          onPeriodo={setPeriodo}
          onZona={setZona}
          carregando={loading}
          aposPorDia={<DenunciasPorHora />}
        />
      </div>
    </AppLayout>
  )
}
