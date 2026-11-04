import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../test/supabaseMock'
import { supabase } from '../lib/supabaseClient'
import type { Linha } from '../types'
import { DIAS_PADRAO, janelaDoDia, limparCacheDenuncias, useDenuncias } from './useDenuncias'

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
    limparCacheDenuncias()
    vi.mocked(supabase.from).mockReset()
    vi.mocked(supabase.channel).mockReset()
  })

  it('carrega a lista inicial de denúncias', async () => {
    const denunciaFalsa = {
      id: 'd1',
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

  it('carrega só os últimos últimos dias padrão por padrão e o histórico inteiro com null', async () => {
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
    expect(diasAtras).toBeGreaterThan(DIAS_PADRAO - 0.01)
    expect(diasAtras).toBeLessThan(DIAS_PADRAO + 0.01)

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

  it('não faz join com linhas e pede só as colunas usadas', async () => {
    const cadeia = createChainable({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValue(cadeia as never)
    mockChannelComHandlers()

    const { result } = renderHook(() => useDenuncias(linhas))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const colunas = vi.mocked(cadeia.select as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(colunas).not.toContain('linhas(')
    expect(colunas).not.toBe('*')
    expect(colunas).toContain('numero_veiculo')
  })

  it('anexa a linha às denúncias mesmo quando as linhas chegam depois', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({
        data: [
          {
            id: 'd1',
            linha_id: 'l1',
            tipo: 'quebrado',
            status: 'pendente',
            descricao: 'teste',
            latitude: 0,
            longitude: 0,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
        error: null,
      }) as never
    )
    mockChannelComHandlers()

    const { result, rerender } = renderHook(({ ls }) => useDenuncias(ls), {
      initialProps: { ls: [] as Linha[] },
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.denuncias[0].linha).toBeUndefined()

    rerender({ ls: linhas })

    expect(result.current.denuncias[0].linha).toEqual(linhas[0])
  })

  it('com apenasMinhas, lê a visão minhas_denuncias e escuta só atualização e exclusão', async () => {
    const cadeia = createChainable({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValue(cadeia as never)
    const canal: Record<string, unknown> = {
      on: vi.fn(() => canal),
      subscribe: vi.fn(() => canal),
    }
    vi.mocked(supabase.channel).mockReturnValue(canal as never)

    const { result } = renderHook(() => useDenuncias(linhas, null, true))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(supabase.from).toHaveBeenCalledWith('minhas_denuncias')
    const eventos = vi.mocked(canal.on as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[1].event)
    expect(eventos.sort()).toEqual(['DELETE', 'UPDATE'])
  })

  it('na lista geral lê a tabela denuncias e escuta também as novas', async () => {
    vi.mocked(supabase.from).mockReturnValue(createChainable({ data: [], error: null }) as never)
    const canal: Record<string, unknown> = {
      on: vi.fn(() => canal),
      subscribe: vi.fn(() => canal),
    }
    vi.mocked(supabase.channel).mockReturnValue(canal as never)

    const { result } = renderHook(() => useDenuncias(linhas))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(supabase.from).toHaveBeenCalledWith('denuncias')
    const eventos = vi.mocked(canal.on as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[1].event)
    expect(eventos.sort()).toEqual(['DELETE', 'INSERT', 'UPDATE'])
  })

  it('não pede a coluna user_id (a autoria não é pública)', async () => {
    const cadeia = createChainable({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValue(cadeia as never)
    mockChannelComHandlers()

    const { result } = renderHook(() => useDenuncias(linhas))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const colunas = vi.mocked(cadeia.select as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(colunas).not.toContain('user_id')
  })
})

describe('useDenuncias (cache entre páginas)', () => {
  it('reaproveita as denúncias já baixadas ao remontar o hook, sem nova consulta', async () => {
    limparCacheDenuncias()
    vi.mocked(supabase.from).mockReset()
    vi.mocked(supabase.channel).mockReset()
    mockChannelComHandlers()
    vi.mocked(supabase.from).mockReturnValue(createChainable({ data: [], error: null }) as never)

    const primeiro = renderHook(() => useDenuncias(linhas))
    await waitFor(() => expect(primeiro.result.current.loading).toBe(false))
    primeiro.unmount()
    const consultas = vi.mocked(supabase.from).mock.calls.length

    const segundo = renderHook(() => useDenuncias(linhas))
    expect(segundo.result.current.loading).toBe(false)
    expect(vi.mocked(supabase.from).mock.calls.length).toBe(consultas)
  })

  describe('modo "um dia só" (mapa)', () => {
    const denunciaDoDia = (id: string, criada: string) => ({
      id,
      linha_id: 'l1',
      tipo: 'quebrado',
      status: 'pendente',
      descricao: 'teste',
      latitude: -5.09,
      longitude: -42.8,
      created_at: criada,
      updated_at: criada,
    })

    it('janelaDoDia vai da meia-noite local até a meia-noite seguinte', () => {
      const { desde, ate } = janelaDoDia('2026-11-02')

      expect(new Date(desde).getHours()).toBe(0)
      expect(new Date(desde).getDate()).toBe(2)
      expect(new Date(ate).getDate()).toBe(3)
      expect(new Date(ate).getTime() - new Date(desde).getTime()).toBeGreaterThanOrEqual(23 * 60 * 60 * 1000)
    })

    it('pede ao banco só o dia escolhido, e não os últimos dias', async () => {
      const consulta = createChainable({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(consulta as never)
      mockChannelComHandlers()

      const { result } = renderHook(() => useDenuncias(linhas, DIAS_PADRAO, false, '2026-11-02'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      const { desde, ate } = janelaDoDia('2026-11-02')
      expect(consulta.gte).toHaveBeenCalledWith('created_at', desde)
      expect(consulta.lt).toHaveBeenCalledWith('created_at', ate)
    })

    it('ao trocar de dia busca o novo dia, sem voltar ao "carregando" da primeira vez', async () => {
      const dia1 = createChainable({ data: [denunciaDoDia('d1', new Date(2026, 10, 2, 9).toISOString())], error: null })
      const dia2 = createChainable({ data: [denunciaDoDia('d2', new Date(2026, 10, 1, 9).toISOString())], error: null })
      vi.mocked(supabase.from)
        .mockReturnValueOnce(dia1 as never)
        .mockReturnValueOnce(dia2 as never)
      mockChannelComHandlers()

      const { result, rerender } = renderHook(({ dia }) => useDenuncias(linhas, DIAS_PADRAO, false, dia), {
        initialProps: { dia: '2026-11-02' },
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.denuncias.map((d) => d.id)).toEqual(['d1'])
      expect(result.current.atualizando).toBe(false)

      rerender({ dia: '2026-11-01' })

      expect(result.current.loading).toBe(false)
      await waitFor(() => expect(result.current.denuncias.map((d) => d.id)).toEqual(['d2']))
      expect(result.current.atualizando).toBe(false)
      expect(dia2.gte).toHaveBeenCalledWith('created_at', janelaDoDia('2026-11-01').desde)
    })

    it('voltar a um dia já visto usa o cache, sem nova consulta', async () => {
      const dia1 = createChainable({ data: [denunciaDoDia('d1', new Date(2026, 10, 2, 9).toISOString())], error: null })
      const dia2 = createChainable({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValueOnce(dia1 as never).mockReturnValueOnce(dia2 as never)
      mockChannelComHandlers()

      const { result, rerender } = renderHook(({ dia }) => useDenuncias(linhas, DIAS_PADRAO, false, dia), {
        initialProps: { dia: '2026-11-02' },
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      rerender({ dia: '2026-11-01' })
      await waitFor(() => expect(result.current.atualizando).toBe(false))
      rerender({ dia: '2026-11-02' })

      await waitFor(() => expect(result.current.denuncias.map((d) => d.id)).toEqual(['d1']))
      expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(2)
    })

    it('denúncia nova de outro dia (realtime) não entra no dia escolhido', async () => {
      vi.mocked(supabase.from).mockReturnValue(createChainable({ data: [], error: null }) as never)
      const handlers = mockChannelComHandlers()

      const { result } = renderHook(() => useDenuncias(linhas, DIAS_PADRAO, false, '2026-11-02'))
      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => handlers.INSERT({ new: denunciaDoDia('fora', new Date(2026, 10, 3, 10).toISOString()) }))
      expect(result.current.denuncias).toHaveLength(0)

      act(() => handlers.INSERT({ new: denunciaDoDia('dentro', new Date(2026, 10, 2, 10).toISOString()) }))
      expect(result.current.denuncias.map((d) => d.id)).toEqual(['dentro'])
    })

    it('se a busca do novo dia falhar, não mostra as denúncias do dia anterior', async () => {
      const dia1 = createChainable({ data: [denunciaDoDia('d1', new Date(2026, 10, 2, 9).toISOString())], error: null })
      const falha = createChainable({ data: null, error: { message: 'x' } })
      vi.mocked(supabase.from).mockReturnValueOnce(dia1 as never).mockReturnValueOnce(falha as never)
      mockChannelComHandlers()

      const { result, rerender } = renderHook(({ dia }) => useDenuncias(linhas, DIAS_PADRAO, false, dia), {
        initialProps: { dia: '2026-11-02' },
      })
      await waitFor(() => expect(result.current.loading).toBe(false))
      rerender({ dia: '2026-11-01' })

      await waitFor(() => expect(result.current.error).toMatch(/Não foi possível carregar/))
      expect(result.current.denuncias).toHaveLength(0)
    })
  })
})
