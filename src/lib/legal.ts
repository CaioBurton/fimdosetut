/**
 * Dados que aparecem na Política de Privacidade e nos Termos de Uso.
 *
 * O Fórum é um movimento social sem CNPJ; o canal de contato é o e-mail abaixo. Campos opcionais
 * deixados vazios (`''`) simplesmente não aparecem nos documentos. O texto dos documentos é um
 * modelo e deve ser revisado por quem responde juridicamente pelo Fórum.
 */

/** Versão dos documentos. Mude quando o texto mudar de forma relevante. */
export const VERSAO_DOCUMENTOS = '2026-11-01'
export const DATA_DOCUMENTOS = '01/11/2026'

export const CONTROLADOR = {
  nome: 'Fórum Piauiense de Luta pelo Transporte Público',
  /** Natureza da organização (o Fórum não tem CNPJ). */
  natureza: 'movimento social, sem CNPJ',
  /** Opcional: endereço para correspondência. Vazio = não aparece. */
  endereco: '',
}

export const CONTATO = {
  /** Canal para pedidos sobre dados pessoais (acesso, correção, exclusão etc.). */
  email: 'forumpelotransporte@gmail.com',
  /** Opcional: pessoa responsável por responder aos titulares (encarregado). Vazio = não aparece. */
  encarregado: '',
  instagram: '@fimdosetut',
}

export const FORO = 'comarca de Teresina, Estado do Piauí'

export const ROTAS_LEGAIS = {
  privacidade: '/privacidade',
  termos: '/termos',
} as const
