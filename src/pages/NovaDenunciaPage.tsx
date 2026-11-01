import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { DenunciaForm } from '../components/denuncia/DenunciaForm'
import { useLinhas } from '../hooks/useLinhas'

export function NovaDenunciaPage() {
  const { linhas, loading } = useLinhas()
  const navigate = useNavigate()

  return (
    <AppLayout title="Nova denúncia" largura="estreita">
      {loading ? (
        <p className="p-4 text-center text-brand-green-dark/60">Carregando linhas...</p>
      ) : (
        <DenunciaForm linhas={linhas} onSuccess={() => navigate('/')} />
      )}
    </AppLayout>
  )
}
