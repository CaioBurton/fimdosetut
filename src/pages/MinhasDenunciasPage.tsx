import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { DenunciaCard } from '../components/denuncia/DenunciaCard'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useDenuncias } from '../hooks/useDenuncias'
import { useLinhas } from '../hooks/useLinhas'
import { supabase } from '../lib/supabaseClient'

export function MinhasDenunciasPage() {
  const { user } = useAuth()
  const { linhas } = useLinhas()
  const { denuncias, loading, error } = useDenuncias(linhas)
  const [acaoErro, setAcaoErro] = useState<string | null>(null)

  const minhas = denuncias.filter((d) => d.user_id === user?.id)

  async function alternarStatus(id: string, statusAtual: string) {
    setAcaoErro(null)
    const { error } = await supabase
      .from('denuncias')
      .update({ status: statusAtual === 'pendente' ? 'resolvido' : 'pendente' })
      .eq('id', id)
    if (error) setAcaoErro('Não foi possível atualizar a denúncia. Tente novamente.')
  }

  async function excluir(id: string) {
    setAcaoErro(null)
    const { error } = await supabase.from('denuncias').delete().eq('id', id)
    if (error) setAcaoErro('Não foi possível excluir a denúncia. Tente novamente.')
  }

  return (
    <AppLayout title="Minhas denúncias">
      <div className="space-y-3 p-4">
        {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
        {acaoErro && <p className="text-center text-sm text-zona-leste">{acaoErro}</p>}

        {loading && <p className="text-center text-brand-green-dark/60">Carregando...</p>}

        {!loading && !error && minhas.length === 0 && (
          <p className="py-10 text-center text-brand-green-dark/60">
            Você ainda não enviou nenhuma denúncia.
          </p>
        )}

        {minhas.map((denuncia) => (
          <DenunciaCard
            key={denuncia.id}
            denuncia={denuncia}
            actions={
              <>
                <Button
                  variant="secondary"
                  className="w-auto flex-1 py-2 text-sm"
                  onClick={() => alternarStatus(denuncia.id, denuncia.status)}
                >
                  {denuncia.status === 'pendente' ? 'Marcar resolvido' : 'Reabrir'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-auto flex-1 py-2 text-sm text-zona-leste"
                  onClick={() => excluir(denuncia.id)}
                >
                  Excluir
                </Button>
              </>
            }
          />
        ))}
      </div>
    </AppLayout>
  )
}
