import { describe, expect, it } from 'vitest'
import type { Denuncia } from '../types'
import {
  calcularEstatisticas,
  contarPorDia,
  filtrarDenuncias,
  FILTROS_INICIAIS,
} from './dashboardDenuncias'

const agora = new Date('2026-10-31T15:00:00')

function d(p: Partial<Denuncia> & { id: string }): Denuncia {
  return {
    linha_id: 'l1',
    tipo: 'quebrado',
    status: 'pendente',
    descricao: 'Ônibus parou',
    latitude: 0,
    longitude: 0,
    created_at: '2026-10-31T10:00:00',
    updated_at: '2026-10-31T10:00:00',
    linha: { id: 'l1', codigo: '101', nome: 'Centro', zona: 'norte' },
    ...p,
  }
}

const dados = [
  d({ id: '1' }),
  d({ id: '2', tipo: 'atraso', status: 'resolvido', created_at: '2026-10-28T10:00:00' }),
  d({
    id: '3',
    linha_id: 'l2',
    linha: { id: 'l2', codigo: '202', nome: 'Praia', zona: 'sul' },
    created_at: '2026-09-01T10:00:00',
    numero_veiculo: '4455',
  }),
]

describe('filtrarDenuncias', () => {
  it('sem filtros devolve tudo', () => {
    expect(filtrarDenuncias(dados, FILTROS_INICIAIS, agora)).toHaveLength(3)
  })
  it('filtra por zona, tipo e status', () => {
    expect(filtrarDenuncias(dados, { ...FILTROS_INICIAIS, zona: 'sul' }, agora).map((x) => x.id)).toEqual(['3'])
    expect(filtrarDenuncias(dados, { ...FILTROS_INICIAIS, tipo: 'atraso' }, agora).map((x) => x.id)).toEqual(['2'])
    expect(filtrarDenuncias(dados, { ...FILTROS_INICIAIS, status: 'resolvido' }, agora).map((x) => x.id)).toEqual(['2'])
  })
  it('filtra por período', () => {
    expect(filtrarDenuncias(dados, { ...FILTROS_INICIAIS, periodo: 'hoje' }, agora).map((x) => x.id)).toEqual(['1'])
    expect(filtrarDenuncias(dados, { ...FILTROS_INICIAIS, periodo: '7d' }, agora).map((x) => x.id)).toEqual(['1', '2'])
    expect(filtrarDenuncias(dados, { ...FILTROS_INICIAIS, periodo: '30d' }, agora)).toHaveLength(2)
  })
  it('filtra por linha e busca (sem acento)', () => {
    expect(filtrarDenuncias(dados, { ...FILTROS_INICIAIS, linhaId: 'l2' }, agora)).toHaveLength(1)
    expect(filtrarDenuncias(dados, { ...FILTROS_INICIAIS, busca: 'onibus' }, agora)).toHaveLength(3)
    expect(filtrarDenuncias(dados, { ...FILTROS_INICIAIS, busca: '4455' }, agora).map((x) => x.id)).toEqual(['3'])
  })
})

describe('calcularEstatisticas', () => {
  it('calcula totais e rankings', () => {
    const e = calcularEstatisticas(dados)
    expect(e.total).toBe(3)
    expect(e.resolvidas).toBe(1)
    expect(e.pendentes).toBe(2)
    expect(e.taxaResolucao).toBe(33)
    expect(e.porZona[0]).toEqual({ chave: 'norte', total: 2 })
    expect(e.topLinhas[0].total).toBe(2)
  })
  it('lida com lista vazia', () => {
    expect(calcularEstatisticas([]).taxaResolucao).toBe(0)
  })
})

describe('contarPorDia', () => {
  it('devolve um item por dia, do mais antigo até hoje, contando as denúncias de cada dia', () => {
    const resultado = contarPorDia(dados, 7, agora)

    expect(resultado).toHaveLength(7)
    expect(resultado[6].data.getDate()).toBe(31)
    expect(resultado[6].total).toBe(1) // denúncia 1, de hoje
    expect(resultado[3].data.getDate()).toBe(28)
    expect(resultado[3].total).toBe(1) // denúncia 2
    expect(resultado.reduce((soma, r) => soma + r.total, 0)).toBe(2) // a de setembro fica de fora
  })
})
