import { describe, expect, it } from 'vitest'
import type { Denuncia } from '../types'
import { diasDoPeriodo, resumirDenuncias, resumoDaRpc, taxaResolucao } from './resumoPainel'

function d(p: Partial<Denuncia> & { id: string }): Denuncia {
  const agora = new Date().toISOString()
  return {
    user_id: 'u1',
    linha_id: 'l1',
    tipo: 'quebrado',
    status: 'pendente',
    descricao: 'x',
    latitude: 0,
    longitude: 0,
    created_at: agora,
    updated_at: agora,
    linha: { id: 'l1', codigo: '063', nome: 'DIRCEU / CENTRO', zona: 'leste' },
    ...p,
  }
}

describe('resumoDaRpc', () => {
  it('converte a resposta do banco no formato da tela', () => {
    const resumo = resumoDaRpc({
      total: 4,
      pendentes: 3,
      resolvidas: 1,
      porZona: [{ chave: 'leste', total: 3 }],
      porTipo: [{ chave: 'quebrado', total: 2 }],
      topLinhas: [{ linhaId: 'l1', codigo: '063', nome: 'DIRCEU', total: 3 }],
      porDia: [
        { dia: '2026-10-31', total: 1 },
        { dia: '2026-11-01', total: 2 },
      ],
    })

    expect(resumo.total).toBe(4)
    expect(resumo.hoje).toBe(2)
    expect(resumo.porDia).toHaveLength(2)
    expect(resumo.porDia[1].data.getDate()).toBe(1)
    expect(resumo.porDia[1].data.getMonth()).toBe(10)
    expect(resumo.topLinhas[0]).toEqual({ linhaId: 'l1', codigo: '063', nome: 'DIRCEU', total: 3 })
    expect(taxaResolucao(resumo)).toBe(25)
  })

  it('aguenta linhas removidas e listas vazias', () => {
    const resumo = resumoDaRpc({
      total: 0,
      pendentes: 0,
      resolvidas: 0,
      porZona: [],
      porTipo: [],
      topLinhas: [{ linhaId: null, codigo: null, nome: null, total: 2 }],
      porDia: [],
    })

    expect(resumo.hoje).toBe(0)
    expect(resumo.topLinhas[0]).toMatchObject({ codigo: '—', nome: 'Linha removida' })
    expect(taxaResolucao(resumo)).toBe(0)
  })
})

describe('resumirDenuncias (admin, no navegador)', () => {
  it('resume o período e a zona escolhidos', () => {
    const antigo = new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString()
    const dados = [
      d({ id: '1' }),
      d({ id: '2', status: 'resolvido' }),
      d({ id: '3', created_at: antigo, linha_id: 'l2', linha: { id: 'l2', codigo: '801', nome: 'SANTA FE', zona: 'sul' } }),
    ]

    const trinta = resumirDenuncias(dados, '30d', 'todas')
    expect(trinta.total).toBe(2)
    expect(trinta.hoje).toBe(2)
    expect(trinta.topLinhas[0]).toMatchObject({ codigo: '063', nome: 'DIRCEU / CENTRO', total: 2 })

    const tudoSul = resumirDenuncias(dados, 'todos', 'sul')
    expect(tudoSul.total).toBe(1)
  })
})

describe('diasDoPeriodo', () => {
  it('traduz o período para dias', () => {
    expect(diasDoPeriodo('7d')).toBe(7)
    expect(diasDoPeriodo('30d')).toBe(30)
    expect(diasDoPeriodo('todos')).toBeNull()
  })
})
