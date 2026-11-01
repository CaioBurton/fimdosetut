import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../test/supabaseMock'
import { VERSAO_DOCUMENTOS } from '../lib/legal'
import { supabase } from '../lib/supabaseClient'
import { useAceiteDocumentos } from './useAceiteDocumentos'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

describe('useAceiteDocumentos', () => {
  beforeEach(() => vi.mocked(supabase.from).mockReset())

  it('pede o aceite quando não há registro da versão atual', async () => {
    const cadeia = createChainable({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValue(cadeia as never)

    const { result } = renderHook(() => useAceiteDocumentos('u1'))

    await waitFor(() => expect(result.current.precisaAceitar).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('aceites_documentos')
    expect(cadeia.eq).toHaveBeenCalledWith('user_id', 'u1')
    expect(cadeia.eq).toHaveBeenCalledWith('versao', VERSAO_DOCUMENTOS)
  })

  it('não pede quando a versão atual já foi aceita', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ data: { versao: VERSAO_DOCUMENTOS }, error: null }) as never
    )

    const { result } = renderHook(() => useAceiteDocumentos('u1'))

    await waitFor(() => expect(supabase.from).toHaveBeenCalled())
    await act(async () => {})
    expect(result.current.precisaAceitar).toBe(false)
  })

  it('não bloqueia ninguém quando a consulta falha', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ error: { message: 'relation does not exist' } }) as never
    )

    const { result } = renderHook(() => useAceiteDocumentos('u1'))

    await waitFor(() => expect(supabase.from).toHaveBeenCalled())
    await act(async () => {})
    expect(result.current.precisaAceitar).toBe(false)
  })

  it('não consulta nem pede nada para visitante', async () => {
    const { result } = renderHook(() => useAceiteDocumentos(undefined))

    await act(async () => {})
    expect(supabase.from).not.toHaveBeenCalled()
    expect(result.current.precisaAceitar).toBe(false)
  })

  it('registra o aceite e deixa de pedir', async () => {
    const consulta = createChainable({ data: null, error: null })
    const gravacao = createChainable({ error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(consulta as never).mockReturnValueOnce(gravacao as never)
    const { result } = renderHook(() => useAceiteDocumentos('u1'))
    await waitFor(() => expect(result.current.precisaAceitar).toBe(true))

    await act(async () => {
      await result.current.aceitar()
    })

    expect(gravacao.upsert).toHaveBeenCalledWith(
      { user_id: 'u1', versao: VERSAO_DOCUMENTOS },
      { onConflict: 'user_id,versao', ignoreDuplicates: true }
    )
    expect(result.current.precisaAceitar).toBe(false)
  })

  it('mantém o pedido e mostra erro quando não consegue registrar', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(createChainable({ data: null, error: null }) as never)
      .mockReturnValueOnce(createChainable({ error: { message: 'rls' } }) as never)
    const { result } = renderHook(() => useAceiteDocumentos('u1'))
    await waitFor(() => expect(result.current.precisaAceitar).toBe(true))

    await act(async () => {
      await result.current.aceitar()
    })

    expect(result.current.precisaAceitar).toBe(true)
    expect(result.current.erro).toBe('Não foi possível registrar o seu aceite. Tente novamente.')
  })
})
