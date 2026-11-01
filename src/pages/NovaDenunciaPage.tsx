import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { VincularConta } from '../components/auth/VincularConta'
import { DenunciaForm } from '../components/denuncia/DenunciaForm'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useLinhas } from '../hooks/useLinhas'
import type { TipoProblema } from '../types'

export function NovaDenunciaPage() {
  const { linhas, loading } = useLinhas()
  const { isAnonymous } = useAuth()
  const navigate = useNavigate()
  const inicial = (useLocation().state as { linhaId?: string; tipo?: TipoProblema } | null) ?? undefined
  const [enviadaSemConta, setEnviadaSemConta] = useState(false)

  // Depois da primeira denúncia sem cadastro, convida a criar a conta para acompanhá-la.
  if (enviadaSemConta && isAnonymous) {
    return (
      <AppLayout title="Denúncia enviada" largura="estreita">
        <div className="space-y-4 p-4 lg:p-0">
          <div>
            <h2 className="ttl text-3xl text-brand-green">Denúncia enviada!</h2>
            <p className="mt-1 text-sm font-medium text-brand-green-dark">
              Ela já aparece no mapa. Obrigado por avisar.
            </p>
          </div>
          <VincularConta />
          <Button type="button" variant="ghost" onClick={() => navigate('/')}>
            Agora não, voltar ao mapa
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Nova denúncia">
      {loading ? (
        <p className="p-4 text-center text-brand-green-dark/60">Carregando linhas...</p>
      ) : (
        <DenunciaForm
          linhas={linhas}
          onSuccess={(info) => (info?.semConta ? setEnviadaSemConta(true) : navigate('/'))}
          inicial={inicial}
        />
      )}
    </AppLayout>
  )
}
