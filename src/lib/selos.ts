/**
 * Selos de reconhecimento leve. São só da própria pessoa (aparecem no perfil dela), nascem de
 * denúncias que OUTRAS pessoas confirmaram com "Também vi" e não de quantas ela enviou, e não
 * existe ranking de pessoas. Os números vêm do banco (`meus_selos`); aqui ficam as regras de cada
 * selo, para trocar um limite num lugar só.
 */

/** Denúncias confirmadas numa mesma linha para virar "Fiscal da linha". */
export const LIMITE_FISCAL = 3
/** Dias seguidos colaborando (enviando ou confirmando denúncias) que rendem um selo. */
export const MARCOS_SEQUENCIA = [3, 7, 30]

export interface DadosSelos {
  denunciasConfirmadas: number
  linhas: { linhaId: string; codigo: string; nome: string; confirmadas: number }[]
  sequenciaAtual: number
  melhorSequencia: number
}

export const SELOS_VAZIOS: DadosSelos = {
  denunciasConfirmadas: 0,
  linhas: [],
  sequenciaAtual: 0,
  melhorSequencia: 0,
}

export interface Selo {
  id: string
  titulo: string
  descricao: string
  conquistado: boolean
  /** Para os selos ainda a caminho: quanto falta. */
  progresso?: { atual: number; meta: number }
}

const numero = (valor: unknown) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : 0)

/** Converte a resposta crua da função `meus_selos` (nunca confia no formato). */
export function selosDaRpc(bruto: unknown): DadosSelos {
  if (!bruto || typeof bruto !== 'object') return SELOS_VAZIOS
  const dados = bruto as Record<string, unknown>
  const linhas = Array.isArray(dados.linhas)
    ? dados.linhas.flatMap((l) => {
        if (!l || typeof l !== 'object') return []
        const { linha_id, codigo, nome, confirmadas } = l as Record<string, unknown>
        return typeof codigo === 'string'
          ? [{ linhaId: String(linha_id ?? codigo), codigo, nome: typeof nome === 'string' ? nome : '', confirmadas: numero(confirmadas) }]
          : []
      })
    : []
  return {
    denunciasConfirmadas: numero(dados.denuncias_confirmadas),
    linhas,
    sequenciaAtual: numero(dados.sequencia_atual),
    melhorSequencia: numero(dados.melhor_sequencia),
  }
}

/** Todos os selos conquistados e os que estão a caminho (o próximo marco de cada tipo). */
export function montarSelos(dados: DadosSelos): Selo[] {
  const selos: Selo[] = []

  selos.push({
    id: 'voz-ouvida',
    titulo: 'Voz ouvida',
    descricao: 'Uma denúncia sua foi confirmada por outra pessoa.',
    conquistado: dados.denunciasConfirmadas >= 1,
    progresso: dados.denunciasConfirmadas >= 1 ? undefined : { atual: 0, meta: 1 },
  })

  for (const linha of dados.linhas) {
    const conquistado = linha.confirmadas >= LIMITE_FISCAL
    selos.push({
      id: `fiscal-${linha.linhaId}`,
      titulo: `Fiscal da linha ${linha.codigo}`,
      descricao: conquistado
        ? `${linha.confirmadas} denúncias suas na linha ${linha.codigo} foram confirmadas por outras pessoas.`
        : `Faltam ${LIMITE_FISCAL - linha.confirmadas} denúncias confirmadas na linha ${linha.codigo}.`,
      conquistado,
      progresso: conquistado ? undefined : { atual: linha.confirmadas, meta: LIMITE_FISCAL },
    })
  }

  for (const marco of MARCOS_SEQUENCIA) {
    if (dados.melhorSequencia >= marco) {
      selos.push({
        id: `sequencia-${marco}`,
        titulo: `${marco} dias seguidos`,
        descricao: `Você colaborou ${marco} dias seguidos.`,
        conquistado: true,
      })
    }
  }
  const proximo = MARCOS_SEQUENCIA.find((m) => dados.melhorSequencia < m)
  if (proximo) {
    selos.push({
      id: `sequencia-${proximo}`,
      titulo: `${proximo} dias seguidos`,
      descricao: 'Envie ou confirme denúncias em dias seguidos.',
      conquistado: false,
      progresso: { atual: Math.min(dados.sequenciaAtual, proximo - 1), meta: proximo },
    })
  }

  return selos
}
