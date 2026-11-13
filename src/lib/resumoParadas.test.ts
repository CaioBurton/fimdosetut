import { describe, expect, it } from 'vitest'
import { paradasDaRpc, PARADAS_VAZIO } from './resumoParadas'

describe('paradasDaRpc', () => {
  it('converte a resposta do banco', () => {
    expect(
      paradasDaRpc({
        total: 5,
        pendentes: 3,
        resolvidas: 2,
        porTipo: [
          { chave: 'parada_sem_abrigo', total: 4 },
          { chave: 'parada_sujeira', total: 1 },
        ],
      })
    ).toEqual({
      total: 5,
      pendentes: 3,
      resolvidas: 2,
      porTipo: [
        { chave: 'parada_sem_abrigo', total: 4 },
        { chave: 'parada_sujeira', total: 1 },
      ],
    })
  })

  it('usa zero e lista vazia quando faltam campos', () => {
    expect(paradasDaRpc({})).toEqual(PARADAS_VAZIO)
  })

  it('ignora tipos que não são de parada', () => {
    const r = paradasDaRpc({ total: 1, porTipo: [{ chave: 'quebrado', total: 1 }] })
    expect(r.porTipo).toEqual([])
  })
})
