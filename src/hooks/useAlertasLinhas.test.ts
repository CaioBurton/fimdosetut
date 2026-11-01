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
  new: { id: 'd1', linha_id: 'l1', tipo: 'quebrado', descricao: 'Parou', ...extra },
})

// Responde por tabela: o que o usuário cadastrou (`usuario_linhas`) e se é o autor (`denuncia_autores`).
function mockarTabelas({ interesse, minha }: { interesse: boolean; minha: boolean }) {
  vi.mocked(supabase.from).mockImplementation(((tabela: string) => {
    if (tabela === 'usuario_linhas') {
      return createChainable({ data: interesse ? { linha_id: 'l1' } : null, error: null })
    }
    return createChainable({ data: minha ? { denuncia_id: 'd1' } : null, error: null })
  }) as never)
}

describe('useAlertasLinhas', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
    vi.mocked(supabase.channel).mockReset()
  })

  it('cria um alerta quando outra pessoa reporta problema numa linha do perfil', async () => {
    const handlers = mockChannel()
    mockarTabelas({ interesse: true, minha: false })

    const { result } = renderHook(() => useAlertasLinhas('u1', linhas))
    act(() => handlers.INSERT(nova()))

    await waitFor(() => expect(result.current.alertas).toHaveLength(1))
    expect(result.current.alertas[0]).toMatchObject({ linhaId: 'l1', tipo: 'quebrado' })
  })

  it('ignora linhas que o usuário não cadastrou', async () => {
    const handlers = mockChannel()
    mockarTabelas({ interesse: false, minha: false })

    const { result } = renderHook(() => useAlertasLinhas('u1', linhas))
    act(() => handlers.INSERT(nova()))

    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('usuario_linhas'))
    expect(result.current.alertas).toHaveLength(0)
  })

  it('não avisa sobre as próprias denúncias (a autoria é consultada na tabela privada)', async () => {
    const handlers = mockChannel()
    mockarTabelas({ interesse: true, minha: true })

    const { result } = renderHook(() => useAlertasLinhas('u1', linhas))
    act(() => handlers.INSERT(nova()))

    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('denuncia_autores'))
    expect(result.current.alertas).toHaveLength(0)
  })
})
