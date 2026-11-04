import { describe, expect, it } from 'vitest'
import { rankingDaRpc } from './rankingSemana'
import { LIMITE_FISCAL, MARCOS_SEQUENCIA, montarSelos, SELOS_VAZIOS, selosDaRpc, type DadosSelos } from './selos'

const dados = (parcial: Partial<DadosSelos> = {}): DadosSelos => ({ ...SELOS_VAZIOS, ...parcial })
const porId = (d: DadosSelos) => Object.fromEntries(montarSelos(d).map((s) => [s.id, s]))

describe('montarSelos', () => {
  it('sem nenhuma colaboração só mostra o que está a caminho', () => {
    const selos = montarSelos(SELOS_VAZIOS)

    expect(selos.every((s) => !s.conquistado)).toBe(true)
    expect(selos.map((s) => s.id)).toEqual(['voz-ouvida', `sequencia-${MARCOS_SEQUENCIA[0]}`])
  })

  it('"Voz ouvida" vem da primeira denúncia confirmada por outra pessoa', () => {
    expect(porId(dados({ denunciasConfirmadas: 1 }))['voz-ouvida'].conquistado).toBe(true)
    expect(porId(dados({ denunciasConfirmadas: 0 }))['voz-ouvida'].conquistado).toBe(false)
  })

  it('"Fiscal da linha" só sai com denúncias confirmadas na mesma linha, e mostra o progresso antes', () => {
    const linha = { linhaId: 'l1', codigo: '603', nome: 'Linha 603' }
    const a_caminho = porId(dados({ linhas: [{ ...linha, confirmadas: LIMITE_FISCAL - 1 }] }))['fiscal-l1']
    const conquistado = porId(dados({ linhas: [{ ...linha, confirmadas: LIMITE_FISCAL }] }))['fiscal-l1']

    expect(a_caminho.titulo).toBe('Fiscal da linha 603')
    expect(a_caminho.conquistado).toBe(false)
    expect(a_caminho.progresso).toEqual({ atual: LIMITE_FISCAL - 1, meta: LIMITE_FISCAL })
    expect(conquistado.conquistado).toBe(true)
    expect(conquistado.progresso).toBeUndefined()
  })

  it('denúncias enviadas, mas sem confirmação de outras pessoas, não rendem selo de linha', () => {
    // a função do banco só devolve linhas com denúncias confirmadas
    expect(montarSelos(dados({ linhas: [] })).some((s) => s.id.startsWith('fiscal-'))).toBe(false)
  })

  it('os selos de sequência acumulam os marcos já alcançados e mostram só o próximo', () => {
    const selos = porId(dados({ melhorSequencia: 7, sequenciaAtual: 2 }))

    expect(selos['sequencia-3'].conquistado).toBe(true)
    expect(selos['sequencia-7'].conquistado).toBe(true)
    expect(selos['sequencia-30'].conquistado).toBe(false)
    expect(selos['sequencia-30'].progresso).toEqual({ atual: 2, meta: 30 })
  })

  it('sem próximo marco quando todos foram alcançados', () => {
    const selos = montarSelos(dados({ melhorSequencia: 45 }))

    expect(selos.filter((s) => s.id.startsWith('sequencia-'))).toHaveLength(MARCOS_SEQUENCIA.length)
    expect(selos.every((s) => s.conquistado || !s.id.startsWith('sequencia-'))).toBe(true)
  })

  it('o progresso da sequência nunca passa do que falta para o marco', () => {
    const selos = porId(dados({ sequenciaAtual: 5, melhorSequencia: 2 }))

    expect(selos['sequencia-3'].progresso).toEqual({ atual: 2, meta: 3 })
  })
})

describe('selosDaRpc', () => {
  it('lê a resposta do banco', () => {
    expect(
      selosDaRpc({
        denuncias_confirmadas: 4,
        linhas: [{ linha_id: 'l1', codigo: '103', nome: 'MOCAMBINHO', confirmadas: 3 }],
        sequencia_atual: 2,
        melhor_sequencia: 5,
      })
    ).toEqual({
      denunciasConfirmadas: 4,
      linhas: [{ linhaId: 'l1', codigo: '103', nome: 'MOCAMBINHO', confirmadas: 3 }],
      sequenciaAtual: 2,
      melhorSequencia: 5,
    })
  })

  it('não quebra com resposta vazia, estranha ou incompleta', () => {
    expect(selosDaRpc(null)).toEqual(SELOS_VAZIOS)
    expect(selosDaRpc('texto')).toEqual(SELOS_VAZIOS)
    expect(selosDaRpc({ linhas: [null, 3, { nome: 'sem código' }] })).toEqual(SELOS_VAZIOS)
  })
})

describe('rankingDaRpc', () => {
  it('lê as linhas do ranking e usa "outras" para zona desconhecida', () => {
    expect(
      rankingDaRpc([
        { linha_id: 'l1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte', denuncias: 12, pessoas: 8, confirmacoes: 20, pendentes: 5 },
        { linha_id: 'l2', codigo: '200', nome: 'CENTRO', zona: 'marte', denuncias: 3, pessoas: 2, confirmacoes: 0, pendentes: 1 },
      ])
    ).toEqual([
      { linhaId: 'l1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte', denuncias: 12, pessoas: 8, confirmacoes: 20, pendentes: 5 },
      { linhaId: 'l2', codigo: '200', nome: 'CENTRO', zona: 'outras', denuncias: 3, pessoas: 2, confirmacoes: 0, pendentes: 1 },
    ])
  })

  it('devolve lista vazia para resposta que não é lista', () => {
    expect(rankingDaRpc(null)).toEqual([])
    expect(rankingDaRpc({})).toEqual([])
    expect(rankingDaRpc([null, { nome: 'sem código' }])).toEqual([])
  })
})
