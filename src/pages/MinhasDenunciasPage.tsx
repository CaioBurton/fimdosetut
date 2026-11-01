import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { PerfilUsuario } from '../components/perfil/PerfilUsuario'
import { DenunciaCard } from '../components/denuncia/DenunciaCard'
import { Button } from '../components/ui/Button'
import { Instagram } from '../components/ui/Instagram'
import { Paginacao } from '../components/ui/Paginacao'
import { TituloSecao } from '../components/ui/TituloSecao'
import { useAuth } from '../hooks/useAuth'
import { useDenuncias } from '../hooks/useDenuncias'
import { useLinhas } from '../hooks/useLinhas'
import { supabase } from '../lib/supabaseClient'

const POR_PAGINA = 5

export function MinhasDenunciasPage() {
  const { user } = useAuth()
  const { linhas } = useLinhas()
  const { denuncias, loading, error } = useDenuncias(linhas, null, user?.id)
  const [acaoErro, setAcaoErro] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)

  const minhas = denuncias.filter((d) => d.user_id === user?.id)
  const totalPaginas = Math.max(1, Math.ceil(minhas.length / POR_PAGINA))
  // Se a lista encolher (ex.: excluir a última denúncia da página), volta para uma página válida.
  const paginaAtual = Math.min(pagina, totalPaginas)
  const daPagina = minhas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA)

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
    <AppLayout title="Perfil">
      <div className="space-y-4 p-4">
        {user && (
          <PerfilUsuario
            userId={user.id}
            email={user.email ?? ''}
            criadoEm={user.created_at}
            linhas={linhas}
            totalDenuncias={minhas.length}
            totalResolvidas={minhas.filter((d) => d.status === 'resolvido').length}
          />
        )}
        <div className="pt-4">
          <TituloSecao>Minhas denúncias</TituloSecao>
        </div>
        {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
        {acaoErro && <p className="text-center text-sm text-zona-leste">{acaoErro}</p>}

        {loading && <p className="text-center text-brand-green-dark/60">Carregando...</p>}

        {!loading && !error && minhas.length === 0 && (
          <p className="py-10 text-center text-brand-green-dark/60">
            Você ainda não enviou nenhuma denúncia.
          </p>
        )}

        {daPagina.map((denuncia) => (
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

        <Paginacao pagina={paginaAtual} totalPaginas={totalPaginas} onChange={setPagina} />

        <div className="flex flex-col items-center gap-2 pt-6 text-center">
          <p className="text-sm font-medium text-brand-green-dark/80">Acompanhe o Fórum nas redes</p>
          <Instagram />
        </div>
      </div>
    </AppLayout>
  )
}
