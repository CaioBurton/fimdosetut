import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useDesktop } from '../../hooks/useDesktop'
import { CabecalhoPagina } from '../ui/CabecalhoPagina'
import { supabase } from '../../lib/supabaseClient'
import { enviarFoto, removerFotos, TAMANHO_MAXIMO_ORIGINAL } from '../../lib/fotosDenuncias'
import { ehAcessibilidade, TIPO_LABELS, type Linha, type TipoProblema } from '../../types'
import { LinksLegais } from '../legal/LinksLegais'
import { VERSAO_DOCUMENTOS } from '../../lib/legal'
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
  /** `semConta` é verdadeiro quando a denúncia saiu de uma sessão sem cadastro (convite para criar a conta). */
  onSuccess: (info?: { semConta: boolean }) => void
  /** Linha e tipo já escolhidos (ex.: vindos da denúncia rápida quando o GPS falhou). */
  inicial?: { linhaId?: string; tipo?: TipoProblema }
}) {
  const { user, isAnonymous, signInAnonimo } = useAuth()
  const desktop = useDesktop()
  const [linhaId, setLinhaId] = useState(inicial?.linhaId ?? '')
  const [tipo, setTipo] = useState<TipoProblema>(inicial?.tipo ?? 'quebrado')
  const [descricao, setDescricao] = useState('')
  const [numeroVeiculo, setNumeroVeiculo] = useState('')
  const [local, setLocal] = useState<{ lat: number; lng: number } | null>(null)
  const [aceitou, setAceitou] = useState(false)
  const [foto, setFoto] = useState<File | null>(null)
  const [erroFoto, setErroFoto] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Prévia local da foto escolhida (nada é enviado antes de "Enviar denúncia").
  const previa = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto])
  useEffect(() => {
    if (!previa) return
    return () => URL.revokeObjectURL(previa)
  }, [previa])

  function escolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) {
      setErroFoto('Escolha um arquivo de imagem (foto).')
      return
    }
    if (arquivo.size > TAMANHO_MAXIMO_ORIGINAL) {
      setErroFoto('Essa imagem é grande demais. Escolha outra foto.')
      return
    }
    setErroFoto(null)
    setFoto(arquivo)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!linhaId) {
      setErro('Selecione a linha.')
      return
    }
    if (!local) {
      setErro('Marque a localização no mapa.')
      return
    }

    if (!user && !aceitou) {
      setErro('Aceite a Política de Privacidade e os Termos de Uso para enviar.')
      return
    }

    setEnviando(true)
    setErro(null)

    // Sem conta: abre uma sessão anônima só para esta denúncia. O aceite da política vai junto e
    // fica registrado no servidor; a pessoa pode criar a conta depois, mantendo a denúncia.
    if (!user) {
      const { error: erroAnonimo } = await signInAnonimo({
        aceite_documentos: VERSAO_DOCUMENTOS,
        aceite_em: new Date().toISOString(),
      })
      if (erroAnonimo) {
        setEnviando(false)
        setErro('Não foi possível enviar agora. Verifique sua conexão ou entre com uma conta.')
        return
      }
    }

    // A foto vai antes, para a denúncia já nascer com ela (o envio precisa de sessão, por isso vem
    // depois do login anônimo). O arquivo é comprimido no aparelho e perde os metadados (EXIF/GPS).
    let fotoPath: string | null = null
    if (foto) {
      const envio = await enviarFoto(foto)
      if (envio.error) {
        setEnviando(false)
        setErro(envio.error)
        return
      }
      fotoPath = envio.path
    }

    // A função do banco grava a denúncia e a autoria (privada) juntas, em nome de quem está logado.
    const { error } = await supabase.rpc('criar_denuncia', {
      p_linha_id: linhaId,
      p_tipo: tipo,
      p_descricao: descricao.trim() || `Denúncia: ${TIPO_LABELS[tipo].toLowerCase()}.`,
      p_numero_veiculo: numeroVeiculo.trim() || null,
      p_latitude: local.lat,
      p_longitude: local.lng,
      p_foto_path: fotoPath,
    })

    if (error && fotoPath) await removerFotos([fotoPath])

    setEnviando(false)

    if (error) {
      setErro(
        error.message.includes('limite de denúncias')
          ? 'Você enviou muitas denúncias em pouco tempo. Crie uma conta ou tente mais tarde.'
          : 'Não foi possível enviar a denúncia. Verifique sua conexão e tente novamente.'
      )
      return
    }

    onSuccess({ semConta: !user || isAnonymous })
  }

  const destacarVeiculo = ehAcessibilidade(tipo)
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
        <div
          className={
            destacarVeiculo
              ? 'border-2 border-brand-green bg-brand-green/10 p-3 shadow-[3px_3px_0_#052d00]'
              : undefined
          }
        >
          <label htmlFor="numero-veiculo" className={rotulo}>
            Número do veículo{' '}
            <span className="font-semibold normal-case tracking-normal text-brand-green-dark/70">
              {destacarVeiculo ? '(importante)' : '(opcional)'}
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
            {destacarVeiculo
              ? 'Com o número do ônibus dá para provar quais veículos estão sem acessibilidade. Está no painel ou na lateral.'
              : 'Está no painel ou na lateral do ônibus.'}
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
            Descrição{' '}
            <span className="font-semibold normal-case tracking-normal text-brand-green-dark/70">
              (opcional)
            </span>
          </label>
          <textarea
            id="descricao-denuncia"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            placeholder="Descreva o que está acontecendo..."
            className="input-brand !py-3"
          />
        </div>
        {/* relative: ancora o input escondido (sr-only é absolute) aqui; sem isso o foco nele rola a página toda e abre uma faixa em branco. */}
        <div className="relative">
          <span className={rotulo}>
            Foto{' '}
            <span className="font-semibold normal-case tracking-normal text-brand-green-dark/70">
              (opcional)
            </span>
          </span>
          {previa && (
            <div className="space-y-2">
              <img
                src={previa}
                alt="Prévia da foto escolhida"
                className="max-h-60 w-full rounded-[2px] border-2 border-brand-green bg-brand-green/5 object-contain"
              />
              <button type="button" className="chip-brand" onClick={() => setFoto(null)}>
                Remover foto
              </button>
            </div>
          )}
          <div className={`grid grid-cols-2 gap-2 ${previa ? 'mt-2' : ''}`}>
            <label
              htmlFor="foto-camera"
              className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[2px] border-2 border-dashed border-brand-green bg-white px-2 text-center text-sm font-bold text-brand-green-dark"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="6" width="18" height="14" rx="1" />
                <circle cx="12" cy="13" r="3.5" />
                <path d="M8 6l1.5-2h5L16 6" />
              </svg>
              Tirar foto
            </label>
            <label
              htmlFor="foto-denuncia"
              className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[2px] border-2 border-dashed border-brand-green bg-white px-2 text-center text-sm font-bold text-brand-green-dark"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="1" />
                <circle cx="9" cy="10" r="1.5" />
                <path d="M21 16l-5-5-8 8" />
              </svg>
              Escolher da galeria
            </label>
          </div>
          <input
            id="foto-camera"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={escolherFoto}
            className="sr-only"
            aria-label="Tirar foto com a câmera"
          />
          <input
            id="foto-denuncia"
            type="file"
            accept="image/*"
            onChange={escolherFoto}
            className="sr-only"
            aria-label="Foto da denúncia"
          />
          {erroFoto && (
            <p role="alert" className="mt-1.5 text-xs font-bold text-[#8f1f1f]">
              {erroFoto}
            </p>
          )}
          <p className="mt-1.5 text-xs font-semibold text-brand-green-dark/70">
            A foto passa por uma análise antes de aparecer e depois fica pública junto da denúncia.
            Evite mostrar o rosto de pessoas e placas de carros particulares.
          </p>
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
        Sua denúncia (local, descrição, número do veículo e foto) aparece para todos no mapa, sem o seu
        nome. Não escreva dados pessoais de outras pessoas.
      </p>

      {!user && (
        <div className="space-y-1">
          <label className="flex cursor-pointer items-start gap-3 text-sm font-medium leading-snug text-brand-green-dark">
            <input
              type="checkbox"
              checked={aceitou}
              onChange={(e) => {
                setAceitou(e.target.checked)
                setErro(null)
              }}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#084400]"
            />
            <span>
              Li e concordo com a Política de Privacidade e os Termos de Uso, e autorizo o uso dos meus
              dados como descrito nela.
            </span>
          </label>
          <LinksLegais novaAba className="!justify-start" />
          <p className="text-xs font-semibold text-brand-green-dark/70">
            Você não precisa de conta para enviar. Depois da denúncia, pode criar uma para
            acompanhá-la.
          </p>
        </div>
      )}

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
