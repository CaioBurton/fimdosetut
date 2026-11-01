import { useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useDesktop } from '../../hooks/useDesktop'
import { CabecalhoPagina } from '../ui/CabecalhoPagina'
import { supabase } from '../../lib/supabaseClient'
import type { Linha, TipoProblema } from '../../types'
import { SecaoNumerada } from '../ui/SecaoNumerada'
import { LocationPicker } from '../map/LocationPicker'
import { LinhaSelect } from './LinhaSelect'
import { TipoSelect } from './TipoSelect'

export function DenunciaForm({
  linhas,
  onSuccess,
  inicial,
}: {
  linhas: Linha[]
  onSuccess: () => void
  /** Linha e tipo já escolhidos (ex.: vindos da denúncia rápida quando o GPS falhou). */
  inicial?: { linhaId?: string; tipo?: TipoProblema }
}) {
  const { user } = useAuth()
  const desktop = useDesktop()
  const [linhaId, setLinhaId] = useState(inicial?.linhaId ?? '')
  const [tipo, setTipo] = useState<TipoProblema>(inicial?.tipo ?? 'quebrado')
  const [descricao, setDescricao] = useState('')
  const [numeroVeiculo, setNumeroVeiculo] = useState('')
  const [local, setLocal] = useState<{ lat: number; lng: number } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!linhaId) {
      setErro('Selecione a linha.')
      return
    }
    if (!local) {
      setErro('Marque a localização no mapa.')
      return
    }

    setEnviando(true)
    setErro(null)

    // A função do banco grava a denúncia e a autoria (privada) juntas, em nome de quem está logado.
    const { error } = await supabase.rpc('criar_denuncia', {
      p_linha_id: linhaId,
      p_tipo: tipo,
      p_descricao: descricao,
      p_numero_veiculo: numeroVeiculo.trim() || null,
      p_latitude: local.lat,
      p_longitude: local.lng,
    })

    setEnviando(false)

    if (error) {
      setErro('Não foi possível enviar a denúncia. Verifique sua conexão e tente novamente.')
      return
    }

    onSuccess()
  }

  const rotulo = 'mb-1.5 block text-xs font-bold uppercase tracking-wide'
  const dica = erro === 'Marque a localização no mapa.' ? 'Sem o local, a denúncia não aparece no mapa.' : null

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-7 p-4 lg:grid lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:items-start lg:gap-x-7 lg:gap-y-7 lg:space-y-0 lg:p-0"
    >
      {desktop ? (
        <div className="lg:col-span-2">
          <CabecalhoPagina
            titulo="Deu o prego?"
            subtitulo="Conte o que aconteceu e marque o local no mapa. Leva menos de um minuto."
          />
        </div>
      ) : (
      <section className="relative overflow-hidden rounded-[2px] border-2 border-brand-green bg-brand-green p-5 text-brand-cream shadow-[4px_4px_0_#052d00]">
        <img
          src="/brand/explosao-contorno.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-2.5 w-60 max-w-none opacity-35 brightness-[2.2]"
        />
        <div className="relative">
          <p className="ttl text-[40px] leading-[0.9]">
            Deu o<br />prego?
          </p>
          <p className="mt-2.5 max-w-[230px] text-sm font-medium leading-snug">
            Conte o que aconteceu com o ônibus. Leva menos de um minuto e aparece no mapa na hora.
          </p>
        </div>
      </section>
      )}

      <SecaoNumerada numero={1} titulo="Qual ônibus?" subtitulo="A linha em que você estava">
        <div>
          <span className={rotulo}>Linha</span>
          <LinhaSelect linhas={linhas} value={linhaId} onChange={setLinhaId} />
        </div>
        <div>
          <label htmlFor="numero-veiculo" className={rotulo}>
            Número do veículo{' '}
            <span className="font-semibold normal-case tracking-normal text-brand-green-dark/70">
              (opcional)
            </span>
          </label>
          <input
            id="numero-veiculo"
            type="text"
            value={numeroVeiculo}
            onChange={(e) => setNumeroVeiculo(e.target.value)}
            maxLength={20}
            placeholder="Ex.: 12345"
            className="input-brand"
          />
          <p className="mt-1.5 text-xs font-semibold text-brand-green-dark/70">
            Está no painel ou na lateral do ônibus.
          </p>
        </div>
      </SecaoNumerada>

      <SecaoNumerada numero={2} titulo="O que aconteceu?" subtitulo="Escolha o problema e descreva">
        <div>
          <span className={rotulo}>Tipo de problema</span>
          <TipoSelect value={tipo} onChange={setTipo} />
        </div>
        <div>
          <label htmlFor="descricao-denuncia" className={rotulo}>
            Descrição
          </label>
          <textarea
            id="descricao-denuncia"
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            placeholder="Descreva o que está acontecendo..."
            className="input-brand !py-3"
          />
        </div>
      </SecaoNumerada>

      <div className="lg:col-start-2 lg:row-span-6 lg:row-start-2">
      <SecaoNumerada numero={3} titulo="Onde?" subtitulo="Marque o local exato no mapa">
        <LocationPicker
          value={local}
          onChange={(lat, lng) => setLocal({ lat, lng })}
          invalido={erro === 'Marque a localização no mapa.'}
        />
      </SecaoNumerada>
      </div>

      <p className="text-xs font-semibold leading-snug text-brand-green-dark/80">
        Sua denúncia (local, descrição e número do veículo) aparece para todos no mapa, sem o seu
        nome. Não escreva dados pessoais de outras pessoas.
      </p>

      {erro && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[2px] border-2 border-[#c23838] bg-white px-3.5 py-3 text-[#8f1f1f]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c23838" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
            <path d="M12 3l10 18H2L12 3z" />
            <path d="M12 10v5M12 18h.01" />
          </svg>
          <div>
            <p className="text-[15px] font-extrabold">{erro}</p>
            {dica && <p className="mt-0.5 text-[13px] font-semibold">{dica}</p>}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="ttl flex min-h-[60px] w-full items-center justify-center gap-3 rounded-[2px] border-2 border-brand-green bg-brand-green text-xl text-brand-cream shadow-[4px_4px_0_#052d00] disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : 'Enviar denúncia'}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  )
}
