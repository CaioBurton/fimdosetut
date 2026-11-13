import { describe, expect, it } from 'vitest'
import type { Denuncia } from '../types'
import { paradasDaRpc, PARADAS_VAZIO, resumirParadas } from './resumoParadas'

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

describe('resumirParadas', () => {
  const base: Denuncia = {
    id: 'x',
    linha_id: null,
    local_tipo: 'parada',
    tipo: 'parada_sem_abrigo',
    status: 'pendente',
    descricao: 'x',
    latitude: 0,
    longitude: 0,
    created_at: '2026-11-13T10:00:00',
    updated_at: '2026-11-13T10:00:00',
  }

  it('conta só denúncias de parada, por tipo e por status', () => {
    const r = resumirParadas([
      { ...base, id: '1' },
      { ...base, id: '2', status: 'resolvido' },
      { ...base, id: '3', tipo: 'parada_sujeira' },
      { ...base, id: '4', local_tipo: 'onibus', linha_id: 'l1', tipo: 'quebrado' },
    ])
    expect(r.total).toBe(3)
    expect(r.pendentes).toBe(2)
    expect(r.resolvidas).toBe(1)
    expect(r.porTipo).toEqual([
      { chave: 'parada_sem_abrigo', total: 2 },
      { chave: 'parada_sujeira', total: 1 },
    ])
  })

  it('sem paradas devolve tudo zerado', () => {
    expect(resumirParadas([{ ...base, local_tipo: 'onibus', linha_id: 'l1', tipo: 'quebrado' }])).toEqual(PARADAS_VAZIO)
  })
})
