import { gerarCartaoPainel, textoPainel, type DadosCartaoPainel } from '../../lib/cartaoCompartilhavel'
import { BotaoCompartilhar } from './BotaoCompartilhar'

/** Botão de compartilhar de uma seção do painel: vira um cartão 4:5 para postar no Instagram. */
export function BotaoCompartilharPainel({ dados, arquivo }: { dados: DadosCartaoPainel; arquivo: string }) {
  return (
    <BotaoCompartilhar
      rotulo={`Compartilhar ${dados.titulo.toLowerCase()}`}
      gerar={() => gerarCartaoPainel(dados)}
      nomeArquivo={`deu-o-prego-${arquivo}.png`}
      titulo="Deu o Prego!"
      texto={textoPainel(dados)}
    />
  )
}
