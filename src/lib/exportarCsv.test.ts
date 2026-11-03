import { describe, expect, it } from 'vitest'
import type { Denuncia } from '../types'
import { denunciasParaCsv } from './exportarCsv'

const base: Denuncia = {
  id: '1',
  linha_id: 'l1',
  tipo: 'pcd_elevador',
  status: 'pendente',
  descricao: 'Plataforma "travada"; motorista não ajudou',
  numero_veiculo: ' 12345 ',
  latitude: -5.09,
  longitude: -42.8,
  // 01:30 UTC = 22:30 do dia anterior em Teresina
  created_at: '2026-11-02T01:30:00Z',
  updated_at: '2026-11-02T01:30:00Z',
  confirmacoes: 3,
  linha: { id: 'l1', codigo: '063', nome: 'DIRCEU / CENTRO', zona: 'leste' },
}

describe('denunciasParaCsv', () => {
  it('gera cabeçalho e uma linha por denúncia, no fuso de Teresina', () => {
    const [cabecalho, linha] = denunciasParaCsv([base]).split('\r\n')
    expect(cabecalho.startsWith('Data;Hora;Linha;')).toBe(true)
    expect(linha).toBe(
      '01/11/2026;22:30;063;DIRCEU / CENTRO;Leste;PcD: elevador/plataforma quebrado;Pendente;12345;' +
        '"Plataforma ""travada""; motorista não ajudou";-5.09;-42.8;3'
    )
  })

  it('protege contra fórmulas do Excel e aceita campos ausentes', () => {
    const csv = denunciasParaCsv([
      { ...base, descricao: '=HYPERLINK("x")', numero_veiculo: null, linha: undefined, confirmacoes: undefined },
    ])
    const linha = csv.split('\r\n')[1]
    expect(linha).toContain(`"'=HYPERLINK(""x"")"`)
    expect(linha.startsWith('01/11/2026;22:30;;;Outras;')).toBe(true)
    expect(linha.endsWith(';0')).toBe(true)
  })

  it('devolve só o cabeçalho quando não há denúncias', () => {
    expect(denunciasParaCsv([]).split('\r\n')).toHaveLength(1)
  })
})
