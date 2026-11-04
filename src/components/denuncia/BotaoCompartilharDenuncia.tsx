import { dadosDoCartao, gerarCartaoDenuncia, textoDenuncia } from '../../lib/cartaoCompartilhavel'
import type { Denuncia } from '../../types'
import { BotaoCompartilhar } from '../ui/BotaoCompartilhar'

/** Compartilha uma denúncia como imagem para o Instagram e o WhatsApp. */
export function BotaoCompartilharDenuncia({ denuncia }: { denuncia: Denuncia }) {
  const dados = dadosDoCartao(denuncia)
  return (
    <BotaoCompartilhar
      gerar={() => gerarCartaoDenuncia(denuncia)}
      nomeArquivo={`deu-o-prego-linha-${dados.codigo}.png`}
      titulo="Deu o Prego!"
      texto={textoDenuncia(dados)}
    />
  )
}
