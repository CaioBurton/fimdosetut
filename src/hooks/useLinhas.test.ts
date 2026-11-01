import { act, renderHook, waitFor } from '@testing-library/react'
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

describe('useLinhas (administração)', () => {
  const existentes = [
    { id: '1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte' },
    { id: '2', codigo: '801', nome: 'SANTA FE', zona: 'sul' },
  ]

  async function carregar() {
    vi.mocked(supabase.from).mockReset()
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ data: existentes, error: null }) as never
    )
    const hook = renderHook(() => useLinhas())
    await waitFor(() => expect(hook.result.current.loading).toBe(false))
    return hook
  }

  it('cria uma linha e a inclui na lista ordenada', async () => {
    const { result } = await carregar()
    const nova = { id: '3', codigo: '063', nome: 'DIRCEU', zona: 'norte' }
    vi.mocked(supabase.from).mockReturnValue(createChainable({ data: nova, error: null }) as never)

    let erro: string | null = 'x'
    await act(async () => {
      erro = await result.current.criar({ codigo: '063', nome: 'DIRCEU', zona: 'norte' })
    })

    expect(erro).toBeNull()
    expect(result.current.linhas.map((l) => l.codigo)).toEqual(['063', '103', '801'])
  })

  it('devolve mensagem de erro e não altera a lista quando criar falha', async () => {
    const { result } = await carregar()
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ error: { message: 'rls' } }) as never
    )

    let erro: string | null = null
    await act(async () => {
      erro = await result.current.criar({ codigo: '1', nome: 'X', zona: 'sul' })
    })

    expect(erro).toBe('Não foi possível criar a linha. Tente novamente.')
    expect(result.current.linhas).toHaveLength(2)
  })

  it('atualiza uma linha existente', async () => {
    const { result } = await carregar()
    vi.mocked(supabase.from).mockReturnValue(createChainable({ error: null }) as never)

    await act(async () => {
      await result.current.atualizar('2', { codigo: '801', nome: 'SANTA FE NOVA', zona: 'leste' })
    })

    expect(result.current.linhas.find((l) => l.id === '2')).toMatchObject({
      nome: 'SANTA FE NOVA',
      zona: 'leste',
    })
  })

  it('exclui uma linha e avisa quando o banco recusa', async () => {
    const { result } = await carregar()
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ error: { message: 'fk' } }) as never
    )
    let erro: string | null = null
    await act(async () => {
      erro = await result.current.excluir('1')
    })
    expect(erro).toContain('não pode ser removida')
    expect(result.current.linhas).toHaveLength(2)

    vi.mocked(supabase.from).mockReturnValue(createChainable({ error: null }) as never)
    await act(async () => {
      await result.current.excluir('1')
    })
    expect(result.current.linhas.map((l) => l.id)).toEqual(['2'])
  })
})
