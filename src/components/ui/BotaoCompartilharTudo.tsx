import { useState } from 'react'
import { compartilharImagens, gerarCarrossel, textoCarrossel } from '../../lib/cartaoCompartilhavel'
import type { Periodo } from '../../lib/dashboardDenuncias'
import type { ResumoPainel } from '../../lib/resumoPainel'
import type { Zona } from '../../types'

interface Props {
  resumo: ResumoPainel
  periodo: Periodo
  zona: Zona | 'todas'
}

/** Gera um cartão por seção do painel e compartilha todos juntos, para postar como carrossel. */
export function BotaoCompartilharTudo({ resumo, periodo, zona }: Props) {
  const [gerando, setGerando] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null)

  async function compartilhar() {
    setGerando(true)
    setAviso(null)
    try {
      const imagens = await gerarCarrossel(resumo, periodo, zona)
      const resultado = await compartilharImagens(imagens, { titulo: 'Deu o Prego!', texto: textoCarrossel(periodo, zona) })
      if (resultado === 'baixado') setAviso({ texto: `${imagens.length} imagens salvas, na ordem. É só montar o carrossel!`, erro: false })
    } catch {
      setAviso({ texto: 'Não foi possível gerar as imagens.', erro: true })
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
      <button
        type="button"
        onClick={compartilhar}
        disabled={gerando}
        className={`chip-brand disabled:opacity-50 ${gerando ? 'animate-pulse' : ''}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15V3M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" />
        </svg>
        {gerando ? 'Gerando...' : 'Compartilhar tudo (carrossel)'}
      </button>
      {aviso && (
        <span role={aviso.erro ? 'alert' : 'status'} className={`text-xs font-bold ${aviso.erro ? 'text-zona-leste' : 'text-brand-green'}`}>
          {aviso.texto}
        </span>
      )}
    </div>
  )
}
