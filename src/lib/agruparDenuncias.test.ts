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
    // Âncora = a mais antiga; a lista do grupo começa pela mais recente.
    expect(grupos[0].principal.id).toBe('c')
    expect(grupos[0].denuncias.map((d) => d.id)).toEqual(['a', 'b', 'c'])
  })

  it('mantém a posição e o id do grupo quando chega uma denúncia nova', () => {
    const antes = [
      denuncia({ id: 'a', created_at: minutosAtras(30) }),
      denuncia({ id: 'b', latitude: -5.0905, created_at: minutosAtras(20) }),
    ]
    const depois = [...antes, denuncia({ id: 'c', longitude: -42.8015, created_at: minutosAtras(1) })]
    const g1 = agruparDenuncias(antes)[0]
    const g2 = agruparDenuncias(depois)[0]
    expect(g2.denuncias).toHaveLength(3)
    expect(g2.principal.id).toBe(g1.principal.id)
    expect([g2.principal.latitude, g2.principal.longitude]).toEqual([g1.principal.latitude, g1.principal.longitude])
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

  it('agrupa denúncias de parada (sem linha) do mesmo tipo e próximas', () => {
    const parada = { local_tipo: 'parada' as const, linha_id: null, tipo: 'parada_sem_abrigo' as const }
    const grupos = agruparDenuncias([
      denuncia({ id: 'a', ...parada }),
      denuncia({ id: 'b', ...parada, latitude: -5.0905, created_at: minutosAtras(10) }),
      denuncia({ id: 'c', ...parada, tipo: 'parada_sujeira', created_at: minutosAtras(5) }),
    ])
    expect(grupos).toHaveLength(2)
    expect(grupos.find((g) => g.principal.id === 'b')?.denuncias).toHaveLength(2)
  })

  it('não mistura parada com ônibus no mesmo ponto', () => {
    const grupos = agruparDenuncias([
      denuncia({ id: 'a' }),
      denuncia({ id: 'b', local_tipo: 'parada', linha_id: null, tipo: 'parada_sem_abrigo' }),
    ])
    expect(grupos).toHaveLength(2)
  })
})
