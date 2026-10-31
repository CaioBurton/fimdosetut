import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../test/supabaseMock'
import { supabase } from '../lib/supabaseClient'
import { useLinhas } from './useLinhas'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

describe('useLinhas (integração com o Supabase)', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
  })

  it('carrega as linhas e desliga o loading quando a consulta tem sucesso', async () => {
    const linhasFalsas = [
      { id: '1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte' },
      { id: '2', codigo: '801', nome: 'SANTA FE', zona: 'sul' },
    ]
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ data: linhasFalsas, error: null }) as never
    )

    const { result } = renderHook(() => useLinhas())

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(supabase.from).toHaveBeenCalledWith('linhas')
    expect(result.current.linhas).toEqual(linhasFalsas)
    expect(result.current.error).toBeNull()
  })

  it('expõe uma mensagem de erro amigável quando a consulta falha', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ error: { message: 'network error' } }) as never
    )

    const { result } = renderHook(() => useLinhas())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.linhas).toEqual([])
    expect(result.current.error).toBe('Não foi possível carregar as linhas. Verifique sua conexão.')
  })
})
