import { describe, expect, it } from 'vitest'
import type { Denuncia } from '../types'
import { agruparDenuncias } from './agruparDenuncias'

const BASE = new Date('2026-10-31T12:00:00Z').getTime()

function denuncia(parcial: Partial<Denuncia> & { id: string }): Denuncia {
  return {
    linha_id: 'l1',
    tipo: 'quebrado',
    status: 'pendente',
    descricao: 'x',
    latitude: -5.09,
    longitude: -42.8,
    created_at: new Date(BASE).toISOString(),
    updated_at: new Date(BASE).toISOString(),
    ...parcial,
  }
}

const minutosAtras = (m: number) => new Date(BASE - m * 60000).toISOString()

describe('agruparDenuncias', () => {
  it('agrupa denúncias próximas da mesma linha e tipo', () => {
    const grupos = agruparDenuncias([
      denuncia({ id: 'a' }),
      denuncia({ id: 'b', latitude: -5.0905, created_at: minutosAtras(10) }),
      denuncia({ id: 'c', longitude: -42.8008, created_at: minutosAtras(20) }),
    ])
    expect(grupos).toHaveLength(1)
    expect(grupos[0].denuncias).toHaveLength(3)
    expect(grupos[0].principal.id).toBe('a')
  })

  it('não agrupa denúncias distantes', () => {
    const grupos = agruparDenuncias([
      denuncia({ id: 'a' }),
      denuncia({ id: 'b', latitude: -5.2 }),
    ])
    expect(grupos).toHaveLength(2)
  })

  it('não agrupa linhas, tipos ou status diferentes', () => {
    const grupos = agruparDenuncias([
      denuncia({ id: 'a' }),
      denuncia({ id: 'b', linha_id: 'l2' }),
      denuncia({ id: 'c', tipo: 'atraso' }),
      denuncia({ id: 'd', status: 'resolvido' }),
    ])
    expect(grupos).toHaveLength(4)
  })

  it('não agrupa denúncias fora da janela de tempo', () => {
    const grupos = agruparDenuncias([
      denuncia({ id: 'a' }),
      denuncia({ id: 'b', created_at: minutosAtras(90) }),
    ])
    expect(grupos).toHaveLength(2)
  })

  it('agrupa pelo mesmo número de veículo mesmo distante', () => {
    const grupos = agruparDenuncias([
      denuncia({ id: 'a', numero_veiculo: ' ab123 ' }),
      denuncia({ id: 'b', latitude: -5.2, numero_veiculo: 'AB123', created_at: minutosAtras(5) }),
    ])
    expect(grupos).toHaveLength(1)
  })
})
