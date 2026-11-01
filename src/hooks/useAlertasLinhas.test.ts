import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../test/supabaseMock'
import { supabase } from '../lib/supabaseClient'
import { useAlertasLinhas } from './useAlertasLinhas'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

const linhas = [{ id: 'l1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte' as const }]

function mockChannel() {
  const handlers: Record<string, (payload: unknown) => void> = {}
  const channel: Record<string, unknown> = {
    on: vi.fn((_t: string, filtro: { event: string }, cb: (p: unknown) => void) => {
      handlers[filtro.event] = cb
      return channel
    }),
    subscribe: vi.fn(() => channel),
  }
  vi.mocked(supabase.channel).mockReturnValue(channel as never)
  return handlers
}

const nova = (extra: Record<string, unknown> = {}) => ({
  new: { id: 'd1', user_id: 'outro', linha_id: 'l1', tipo: 'quebrado', descricao: 'Parou', ...extra },
})

describe('useAlertasLinhas', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
    vi.mocked(supabase.channel).mockReset()
  })

  it('cria um alerta quando outra pessoa reporta problema numa linha do perfil', async () => {
    const handlers = mockChannel()
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ data: { linha_id: 'l1' }, error: null }) as never
    )

    const { result } = renderHook(() => useAlertasLinhas('u1', linhas))
    act(() => handlers.INSERT(nova()))

    await waitFor(() => expect(result.current.alertas).toHaveLength(1))
    expect(result.current.alertas[0]).toMatchObject({ linhaId: 'l1', tipo: 'quebrado' })
  })

  it('ignora linhas que o usuário não cadastrou', async () => {
    const handlers = mockChannel()
    vi.mocked(supabase.from).mockReturnValue(createChainable({ data: null, error: null }) as never)

    const { result } = renderHook(() => useAlertasLinhas('u1', linhas))
    act(() => handlers.INSERT(nova()))

    await waitFor(() => expect(supabase.from).toHaveBeenCalled())
    expect(result.current.alertas).toHaveLength(0)
  })

  it('não avisa sobre as próprias denúncias', () => {
    const handlers = mockChannel()
    const { result } = renderHook(() => useAlertasLinhas('u1', linhas))
    act(() => handlers.INSERT(nova({ user_id: 'u1' })))

    expect(supabase.from).not.toHaveBeenCalled()
    expect(result.current.alertas).toHaveLength(0)
  })
})
