/**
 * Dados que aparecem na Política de Privacidade e nos Termos de Uso.
 *
 * ATENÇÃO: os valores marcados com [PREENCHER] precisam ser trocados pelos dados reais da
 * organização responsável antes de divulgar o app. O texto dos documentos é um modelo e deve
 * ser revisado por quem responde juridicamente pelo Fórum.
 */

/** Versão dos documentos. Mude quando o texto mudar de forma relevante. */
export const VERSAO_DOCUMENTOS = '2026-11-01'
export const DATA_DOCUMENTOS = '01/11/2026'

export const CONTROLADOR = {
  nome: 'Fórum Piauiense de Luta pelo Transporte Público',
  /** CNPJ, se houver. */
  documento: '[PREENCHER: CNPJ ou outro identificador da organização]',
  endereco: '[PREENCHER: endereço da organização, Teresina - PI]',
}

export const CONTATO = {
  /** Canal para pedidos sobre dados pessoais (acesso, correção, exclusão etc.). */
  email: '[PREENCHER: e-mail de contato para assuntos de privacidade]',
  /** Pessoa ou setor responsável por responder aos titulares (encarregado). */
  encarregado: '[PREENCHER: nome do encarregado de dados, ou do responsável pelo contato]',
  instagram: '@fimdosetut',
}

export const FORO = 'comarca de Teresina, Estado do Piauí'

export const ROTAS_LEGAIS = {
  privacidade: '/privacidade',
  termos: '/termos',
} as const
