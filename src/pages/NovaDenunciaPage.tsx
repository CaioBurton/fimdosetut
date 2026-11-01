import { useLocation, useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { DenunciaForm } from '../components/denuncia/DenunciaForm'
import { useLinhas } from '../hooks/useLinhas'
import type { TipoProblema } from '../types'

export function NovaDenunciaPage() {
  const { linhas, loading } = useLinhas()
  const navigate = useNavigate()
  const inicial = (useLocation().state as { linhaId?: string; tipo?: TipoProblema } | null) ?? undefined

  return (
    <AppLayout title="Nova denúncia">
      {loading ? (
        <p className="p-4 text-center text-brand-green-dark/60">Carregando linhas...</p>
      ) : (
        <DenunciaForm linhas={linhas} onSuccess={() => navigate('/')} inicial={inicial} />
      )}
    </AppLayout>
  )
}
