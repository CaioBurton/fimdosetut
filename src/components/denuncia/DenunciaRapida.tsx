import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usePerfilUsuario } from '../../hooks/usePerfilUsuario'
import { supabase } from '../../lib/supabaseClient'
import { TIPO_LABELS, type Linha, type TipoProblema } from '../../types'

// Vive só em memória: mantém o card fechado ao navegar pelo app, mas ele volta ao atualizar a página.
let ocultaNaSessao = false

function BotaoFecharCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Fechar denúncia rápida"
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border-2 border-brand-green text-brand-green"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}

const TIPOS = Object.keys(TIPO_LABELS) as TipoProblema[]

type Gps =
  | { estado: 'parado' }
  | { estado: 'buscando' }
  | { estado: 'ok'; lat: number; lng: number }
  | { estado: 'erro' }

/**
 * Denúncia em 3 toques para quem tem linhas favoritas no perfil:
 * 1) toca na linha (o GPS já é pedido aqui), 2) escolhe o problema, 3) envia.
 * Sem descrição e sem marcar o mapa; quem prefere detalhar segue para o formulário completo.
 */
export function DenunciaRapida({ linhas }: { linhas: Linha[] }) {
  const { user, isAnonymous } = useAuth()
  // Sessão anônima (denúncia sem cadastro) não tem perfil: trata como quem não tem conta.
  const logado = !!user && !isAnonymous
  const { linhaIds, loading } = usePerfilUsuario(logado ? user.id : undefined)
  const [linhaId, setLinhaId] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoProblema | null>(null)
  const [gps, setGps] = useState<Gps>({ estado: 'parado' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviada, setEnviada] = useState(false)
  const [oculta, setOculta] = useState(ocultaNaSessao)

  if ((logado && loading) || oculta) return null

  function ocultar() {
    ocultaNaSessao = true
    setOculta(true)
  }

  if (!logado) {
    return (
      <div className="card-brand flex items-start justify-between gap-2 !bg-brand-cream p-3 text-sm">
        <p>
          <Link to="/nova" className="font-bold underline">
            Deu o prego? Denuncie agora
          </Link>{' '}
          sem precisar de conta.
        </p>
        <BotaoFecharCard onClick={ocultar} />
      </div>
    )
  }

  const favoritas = linhas.filter((l) => linhaIds.includes(l.id))

  if (favoritas.length === 0) {
    return (
      <div className="card-brand flex items-start justify-between gap-2 !bg-brand-cream p-3 text-sm">
        <p>
          <Link to="/minhas" className="font-bold underline">
            Adicione as linhas que você pega no perfil
          </Link>{' '}
          para denunciar em 3 toques.
        </p>
        <BotaoFecharCard onClick={ocultar} />
      </div>
    )
  }

  function buscarLocalizacao() {
    if (!navigator.geolocation) {
      setGps({ estado: 'erro' })
      return
    }
    setGps({ estado: 'buscando' })
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ estado: 'ok', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGps({ estado: 'erro' }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }

  function escolherLinha(id: string) {
    setEnviada(false)
    setErro(null)
    setLinhaId(id)
    // O pedido de permissão do GPS nasce de um toque, como os navegadores exigem.
    if (gps.estado === 'parado' || gps.estado === 'erro') buscarLocalizacao()
  }

  function fechar() {
    setLinhaId(null)
    setTipo(null)
    setErro(null)
  }

  async function enviar() {
    if (!linhaId || !tipo || gps.estado !== 'ok') return
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.rpc('criar_denuncia', {
      p_linha_id: linhaId,
      p_tipo: tipo,
      p_descricao: `Denúncia rápida: ${TIPO_LABELS[tipo].toLowerCase()}.`,
      p_numero_veiculo: null,
      p_latitude: gps.lat,
      p_longitude: gps.lng,
    })
    setEnviando(false)
    if (error) {
      setErro('Não foi possível enviar. Verifique sua conexão e tente novamente.')
      return
    }
    fechar()
    setEnviada(true)
  }

  const linha = favoritas.find((l) => l.id === linhaId)

  return (
    <section aria-label="Denúncia rápida" className="card-brand space-y-2.5 !bg-brand-cream p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="ttl text-sm text-brand-green">Deu o prego? Toque na sua linha</p>
        <div className="flex shrink-0 items-center gap-1">
          {linha && (
            <button type="button" onClick={fechar} className="min-h-8 px-2 text-sm font-bold underline">
              Cancelar
            </button>
          )}
          <BotaoFecharCard onClick={ocultar} />
        </div>
      </div>

      <div className="sem-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Suas linhas">
        {favoritas.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={l.id === linhaId}
            onClick={() => escolherLinha(l.id)}
            className={`chip-brand ${l.id === linhaId ? 'chip-brand-ativo' : ''}`}
          >
            {l.codigo}
          </button>
        ))}
      </div>

      {enviada && (
        <p role="status" className="text-sm font-bold text-brand-green">
          Denúncia enviada! Obrigado por avisar.
        </p>
      )}

      {linha && (
        <>
          <p className="text-xs font-semibold text-brand-green-dark/80">
            {linha.codigo} - {linha.nome}
          </p>
          <div className="flex flex-wrap gap-2" aria-label="Tipo de problema">
            {TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={t === tipo}
                onClick={() => setTipo(t)}
                className={`chip-brand ${t === tipo ? 'chip-brand-ativo' : ''}`}
              >
                {TIPO_LABELS[t]}
              </button>
            ))}
          </div>

          <p role="status" className="text-xs font-semibold text-brand-green-dark/80">
            {gps.estado === 'buscando' && 'Buscando sua localização...'}
            {gps.estado === 'ok' && 'Localização encontrada.'}
            {gps.estado === 'erro' && (
              <>
                Não deu para pegar sua localização.{' '}
                <button type="button" onClick={buscarLocalizacao} className="font-bold underline">
                  Tentar de novo
                </button>{' '}
                ou{' '}
                <Link
                  to="/nova"
                  state={{ linhaId, tipo }}
                  className="font-bold underline"
                >
                  marcar no mapa
                </Link>
                .
              </>
            )}
          </p>

          {erro && (
            <p role="alert" className="text-sm font-bold text-zona-leste">
              {erro}
            </p>
          )}

          <button
            type="button"
            onClick={enviar}
            disabled={!tipo || gps.estado !== 'ok' || enviando}
            className="ttl flex min-h-12 w-full items-center justify-center rounded-[2px] border-2 border-brand-green bg-brand-green text-base text-brand-cream disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Enviar denúncia'}
          </button>
        </>
      )}
    </section>
  )
}
