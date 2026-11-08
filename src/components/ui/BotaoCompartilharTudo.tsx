import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useDenuncias } from '../../hooks/useDenuncias'
import { useLinhas } from '../../hooks/useLinhas'
import { useRankingSemana } from '../../hooks/useRankingSemana'
import {
  compartilharImagem,
  compartilharImagens,
  dadosDoDia,
  gerarCarrossel,
  gerarCartaoDia,
  textoCarrossel,
  textoDia,
} from '../../lib/cartaoCompartilhavel'
import type { Periodo } from '../../lib/dashboardDenuncias'
import { hoje } from '../../lib/dia'
import type { ResumoPainel } from '../../lib/resumoPainel'
import type { Zona } from '../../types'

interface Props {
  resumo: ResumoPainel
  periodo: Periodo
  zona: Zona | 'todas'
}

/** Só admin vê: o carrossel e o story são feitos por quem administra a página no Instagram. */
export function BotaoCompartilharTudo(props: Props) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return null
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 lg:ml-auto">
      <CarrosselAdmin {...props} />
      <StoryDoDia />
    </div>
  )
}

type Aviso = { texto: string; erro: boolean }

/** Botão que gera e compartilha imagens; só avisa (flutuando, sem deslocar o botão) quando dá erro. */
function BotaoGerar({
  rotulo,
  desabilitado,
  aoCompartilhar,
}: {
  rotulo: ReactNode
  desabilitado: boolean
  /** Gera e compartilha. Lançar erro mostra a mensagem de falha. */
  aoCompartilhar: () => Promise<void>
}) {
  const [gerando, setGerando] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 5000)
    return () => clearTimeout(t)
  }, [aviso])

  async function clicar() {
    setGerando(true)
    setAviso(null)
    try {
      await aoCompartilhar()
    } catch {
      setAviso({ texto: 'Não foi possível gerar a imagem.', erro: true })
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="relative flex items-center justify-end">
      <button
        type="button"
        onClick={clicar}
        disabled={gerando || desabilitado}
        className={`chip-brand disabled:opacity-50 ${gerando ? 'animate-pulse' : ''}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15V3M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" />
        </svg>
        {gerando ? 'Gerando...' : rotulo}
      </button>
      {aviso && (
        // Flutua (absoluto) acima do botão: não o empurra de lugar e não fica sob a barra de navegação.
        <span
          role={aviso.erro ? 'alert' : 'status'}
          className={`absolute bottom-full right-0 z-10 mb-1 whitespace-nowrap rounded-[2px] border-2 border-brand-green bg-brand-cream px-2 py-1 text-xs font-bold shadow-[2px_2px_0_#084400] ${aviso.erro ? 'text-zona-leste' : 'text-brand-green'}`}
        >
          {aviso.texto}
        </span>
      )}
    </div>
  )
}

/** Gera um cartão por seção do painel (e a linha mais problemática da semana) e compartilha todos juntos. */
function CarrosselAdmin({ resumo, periodo, zona }: Props) {
  const { linhas, loading } = useRankingSemana(1)
  return (
    <BotaoGerar
      rotulo="Semanal"
      desabilitado={loading}
      aoCompartilhar={async () => {
        const imagens = await gerarCarrossel(resumo, periodo, zona, linhas[0] ?? null)
        await compartilharImagens(imagens, { titulo: 'Deu o Prego!', texto: textoCarrossel(periodo, zona) })
      }}
    />
  )
}

const dataPorExtenso = () => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

/** Story (9:16) com as estatísticas de hoje. */
function StoryDoDia() {
  const { linhas } = useLinhas()
  const { denuncias, loading } = useDenuncias(linhas, null, false, hoje())
  return (
    <BotaoGerar
      rotulo="Diário"
      desabilitado={loading}
      aoCompartilhar={async () => {
        const dados = dadosDoDia(denuncias, dataPorExtenso())
        const imagem = await gerarCartaoDia(dados)
        await compartilharImagem(imagem, `deu-o-prego-story-${hoje()}.png`, { titulo: 'Deu o Prego!', texto: textoDia(dados) })
      }}
    />
  )
}
