import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../test/supabaseMock'
import { supabase } from '../lib/supabaseClient'
import { usePainelResumo } from './usePainelResumo'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

const resposta = {
  total: 3,
  pendentes: 2,
  resolvidas: 1,
  porZona: [{ chave: 'leste', total: 3 }],
  porTipo: [{ chave: 'quebrado', total: 3 }],
  topLinhas: [{ linhaId: 'l1', codigo: '063', nome: 'DIRCEU', total: 3 }],
  porDia: [{ dia: '2026-11-01', total: 3 }],
}

function mockarRpc(resultado: { data: unknown; error: unknown }) {
  vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve(resultado) as never)
}

describe('usePainelResumo', () => {
  beforeEach(() => vi.mocked(supabase.rpc).mockReset())

  it('chama a função do banco com os dias e a zona e devolve o resumo', async () => {
    mockarRpc({ data: resposta, error: null })

    const { result } = renderHook(() => usePainelResumo('7d', 'leste'))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(supabase.rpc).toHaveBeenCalledWith('painel_resumo', { dias: 7, zona_filtro: 'leste' })
    expect(result.current.resumo.total).toBe(3)
    expect(result.current.error).toBeNull()
  })

  it('manda null para todo o histórico e todas as zonas', async () => {
    mockarRpc({ data: resposta, error: null })

    const { result } = renderHook(() => usePainelResumo('todos', 'todas'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(supabase.rpc).toHaveBeenCalledWith('painel_resumo', { dias: null, zona_filtro: null })
  })

  it('refaz a consulta ao trocar o período', async () => {
    mockarRpc({ data: resposta, error: null })

    const { result, rerender } = renderHook(({ p }) => usePainelResumo(p, 'todas'), {
      initialProps: { p: '30d' as '30d' | '7d' },
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    rerender({ p: '7d' })
    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledTimes(2))

    expect(vi.mocked(supabase.rpc).mock.calls[1][1]).toEqual({ dias: 7, zona_filtro: null })
  })

  it('mostra mensagem amigável quando a consulta falha', async () => {
    mockarRpc({ data: null, error: { message: 'boom' } })

    const { result } = renderHook(() => usePainelResumo('30d', 'todas'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Não foi possível carregar o painel. Verifique sua conexão.')
  })
})
