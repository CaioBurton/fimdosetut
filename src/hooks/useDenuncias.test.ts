import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../test/supabaseMock'
import { supabase } from '../lib/supabaseClient'
import type { Linha } from '../types'
import { useDenuncias } from './useDenuncias'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

const linhas: Linha[] = [{ id: 'l1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte' }]

function mockChannelComHandlers() {
  const handlers: Record<string, (payload: unknown) => void> = {}
  const channel: Record<string, unknown> = {
    on: vi.fn((_tipo: string, filtro: { event: string }, callback: (p: unknown) => void) => {
      handlers[filtro.event] = callback
      return channel
    }),
    subscribe: vi.fn(() => channel),
  }
  vi.mocked(supabase.channel).mockReturnValue(channel as never)
  return handlers
}

describe('useDenuncias (integração com Supabase + realtime)', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset()
    vi.mocked(supabase.channel).mockReset()
  })

  it('carrega a lista inicial de denúncias', async () => {
    const denunciaFalsa = {
      id: 'd1',
      user_id: 'u1',
      linha_id: 'l1',
      tipo: 'quebrado',
      status: 'pendente',
      descricao: 'teste',
      latitude: -5.09,
      longitude: -42.8,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      linha: linhas[0],
    }
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ data: [denunciaFalsa], error: null }) as never
    )
    mockChannelComHandlers()

    const { result } = renderHook(() => useDenuncias(linhas))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.denuncias).toEqual([denunciaFalsa])
  })

  it('busca todas as páginas quando há mais de 1000 denúncias', async () => {
    const gerar = (quantidade: number, prefixo: string) =>
      Array.from({ length: quantidade }, (_, i) => ({
        id: `${prefixo}${i}`,
        user_id: 'u1',
        linha_id: 'l1',
        tipo: 'quebrado',
        status: 'pendente',
        descricao: 'teste',
        latitude: -5.09,
        longitude: -42.8,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }))
    const primeira = createChainable({ data: gerar(1000, 'a'), error: null })
    const segunda = createChainable({ data: gerar(250, 'b'), error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(primeira as never)
      .mockReturnValueOnce(segunda as never)
    mockChannelComHandlers()

    const { result } = renderHook(() => useDenuncias(linhas))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.denuncias).toHaveLength(1250)
    expect(primeira.range).toHaveBeenCalledWith(0, 999)
    expect(segunda.range).toHaveBeenCalledWith(1000, 1999)
  })

  it('carrega só os últimos 30 dias por padrão e o histórico inteiro com null', async () => {
    const recente = createChainable({ data: [], error: null })
    const historico = createChainable({ data: [], error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(recente as never)
      .mockReturnValueOnce(historico as never)
    mockChannelComHandlers()

    const antes = Date.now()
    const padrao = renderHook(() => useDenuncias(linhas))
    await waitFor(() => expect(padrao.result.current.loading).toBe(false))
    const [, desde] = vi.mocked(recente.gte as ReturnType<typeof vi.fn>).mock.calls[0]
    const diasAtras = (antes - new Date(desde).getTime()) / (24 * 60 * 60 * 1000)
    expect(diasAtras).toBeGreaterThan(29.99)
    expect(diasAtras).toBeLessThan(30.01)

    const tudo = renderHook(() => useDenuncias(linhas, null))
    await waitFor(() => expect(tudo.result.current.loading).toBe(false))
    expect(historico.gte).not.toHaveBeenCalled()
  })

  it('adiciona uma nova denúncia recebida via realtime (INSERT) à frente da lista', async () => {
    vi.mocked(supabase.from).mockReturnValue(createChainable({ data: [], error: null }) as never)
    const handlers = mockChannelComHandlers()

    const { result } = renderHook(() => useDenuncias(linhas))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      handlers.INSERT({
        new: {
          id: 'd2',
          linha_id: 'l1',
          tipo: 'acidente',
          status: 'pendente',
          descricao: 'nova',
          latitude: -5.1,
          longitude: -42.81,
          created_at: '2026-01-02T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      })
    })

    expect(result.current.denuncias).toHaveLength(1)
    expect(result.current.denuncias[0].id).toBe('d2')
    expect(result.current.denuncias[0].linha).toEqual(linhas[0])
  })

  it('atualiza o status de uma denúncia existente via realtime (UPDATE)', async () => {
    const denunciaFalsa = {
      id: 'd1',
      user_id: 'u1',
      linha_id: 'l1',
      tipo: 'quebrado',
      status: 'pendente',
      descricao: 'teste',
      latitude: -5.09,
      longitude: -42.8,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ data: [denunciaFalsa], error: null }) as never
    )
    const handlers = mockChannelComHandlers()

    const { result } = renderHook(() => useDenuncias(linhas))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      handlers.UPDATE({ new: { ...denunciaFalsa, status: 'resolvido' } })
    })

    expect(result.current.denuncias[0].status).toBe('resolvido')
  })

  it('remove uma denúncia da lista via realtime (DELETE)', async () => {
    const denunciaFalsa = {
      id: 'd1',
      user_id: 'u1',
      linha_id: 'l1',
      tipo: 'quebrado',
      status: 'pendente',
      descricao: 'teste',
      latitude: -5.09,
      longitude: -42.8,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ data: [denunciaFalsa], error: null }) as never
    )
    const handlers = mockChannelComHandlers()

    const { result } = renderHook(() => useDenuncias(linhas))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      handlers.DELETE({ old: { id: 'd1' } })
    })

    expect(result.current.denuncias).toHaveLength(0)
  })

  it('expõe uma mensagem de erro amigável quando a consulta inicial falha', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ error: { message: 'network error' } }) as never
    )
    mockChannelComHandlers()

    const { result } = renderHook(() => useDenuncias(linhas))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe(
      'Não foi possível carregar as denúncias. Verifique sua conexão.'
    )
  })
})
