import { useState } from 'react'
import { useFotosPendentes } from '../../hooks/useFotosPendentes'
import { urlFoto } from '../../lib/fotosDenuncias'
import { TIPO_LABELS } from '../../types'
import { Button } from '../ui/Button'

function formatarData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/**
 * Fila de aprovação das fotos. A denúncia já está no mapa; a foto só aparece depois de aprovada.
 * Recusar apaga o arquivo.
 */
export function FotosPendentesAdmin() {
  const { fotos, loading, error, aprovar, recusar } = useFotosPendentes()
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [acaoErro, setAcaoErro] = useState<string | null>(null)

  async function executar(id: string, acao: (id: string) => Promise<string | null>) {
    setAcaoErro(null)
    setOcupado(id)
    const erro = await acao(id)
    setOcupado(null)
    if (erro) setAcaoErro(erro)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-brand-green-dark/80">
        Aprove só fotos ligadas ao problema no ônibus. Recuse fotos com nudez, violência, ofensas, rostos
        de pessoas em destaque ou placas de carros particulares.
      </p>
      {error && <p className="text-center text-sm text-zona-leste">{error}</p>}
      {acaoErro && <p role="alert" className="text-center text-sm text-zona-leste">{acaoErro}</p>}
      {loading && <p className="text-center text-brand-green-dark/60">Carregando...</p>}
      {!loading && !error && fotos.length === 0 && (
        <p className="py-10 text-center text-brand-green-dark/70">Nenhuma foto esperando análise.</p>
      )}

      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0 xl:grid-cols-3">
        {fotos.map((f, i) => (
          <article
            key={f.denuncia_id}
            className="card-brand anim-entra space-y-2.5 p-3.5"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            <a href={urlFoto(f.foto_path)} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={urlFoto(f.foto_path)}
                alt={`Foto enviada com a denúncia ${f.denuncia_id}`}
                loading="lazy"
                className="max-h-72 w-full rounded-[2px] border-2 border-brand-green bg-brand-green/5 object-contain"
              />
            </a>
            <div>
              <p className="text-sm font-bold">
                {f.denuncia?.linha ? `${f.denuncia.linha.codigo} - ${f.denuncia.linha.nome}` : 'Linha removida'}
                {f.denuncia && ` · ${TIPO_LABELS[f.denuncia.tipo]}`}
              </p>
              <p className="text-xs text-brand-green-dark/70">Enviada em {formatarData(f.created_at)}</p>
              {f.denuncia?.descricao && (
                <p className="mt-1 line-clamp-3 break-words text-sm leading-snug">{f.denuncia.descricao}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="w-auto flex-1 py-2 text-sm"
                disabled={ocupado === f.denuncia_id}
                onClick={() => executar(f.denuncia_id, aprovar)}
              >
                Aprovar
              </Button>
              <Button
                variant="ghost"
                className="w-auto flex-1 py-2 text-sm text-zona-leste"
                disabled={ocupado === f.denuncia_id}
                onClick={() => executar(f.denuncia_id, recusar)}
              >
                Recusar
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
