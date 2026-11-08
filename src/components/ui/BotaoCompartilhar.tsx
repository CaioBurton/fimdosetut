import { useEffect, useState } from 'react'
import { compartilharImagem } from '../../lib/cartaoCompartilhavel'

interface BotaoCompartilharProps {
  rotulo?: string
  /** Gera a imagem (PNG) a ser compartilhada. */
  gerar: () => Promise<Blob>
  nomeArquivo: string
  titulo: string
  texto: string
}

/**
 * Gera uma imagem para redes sociais e a compartilha: abre o compartilhamento do celular
 * (Instagram, WhatsApp...) ou, no computador, baixa o arquivo.
 */
export function BotaoCompartilhar({ rotulo = 'Compartilhar', gerar, nomeArquivo, titulo, texto }: BotaoCompartilharProps) {
  const [gerando, setGerando] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null)

  // Como a mensagem flutua, some sozinha depois de alguns segundos.
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(t)
  }, [aviso])

  async function compartilhar() {
    setGerando(true)
    setAviso(null)
    try {
      const imagem = await gerar()
      const resultado = await compartilharImagem(imagem, nomeArquivo, { titulo, texto })
      if (resultado === 'baixado') setAviso({ texto: 'Imagem salva. É só postar!', erro: false })
    } catch {
      setAviso({ texto: 'Não foi possível gerar a imagem.', erro: true })
    } finally {
      setGerando(false)
    }
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={compartilhar}
        disabled={gerando}
        aria-label={gerando ? 'Gerando...' : rotulo}
        title={gerando ? 'Gerando...' : rotulo}
        className={`chip-brand disabled:opacity-50 ${gerando ? 'animate-pulse' : ''}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15V3M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" />
        </svg>
      </button>
      {aviso && (
        // Flutua sobre o conteúdo (absoluto) para a mensagem não empurrar o botão de lugar.
        <span
          role={aviso.erro ? 'alert' : 'status'}
          className={`absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-[2px] border-2 border-brand-green bg-brand-cream px-2 py-1 text-xs font-bold shadow-[2px_2px_0_#084400] ${aviso.erro ? 'text-zona-leste' : 'text-brand-green'}`}
        >
          {aviso.texto}
        </span>
      )}
    </span>
  )
}
