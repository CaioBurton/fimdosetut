import { useState } from 'react'
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
    <>
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
        <span role={aviso.erro ? 'alert' : 'status'} className={`text-xs font-bold ${aviso.erro ? 'text-zona-leste' : 'text-brand-green'}`}>
          {aviso.texto}
        </span>
      )}
    </>
  )
}
