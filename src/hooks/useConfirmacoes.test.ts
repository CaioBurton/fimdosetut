import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../test/supabaseMock'
import { supabase } from '../lib/supabaseClient'
import { useConfirmacoes } from './useConfirmacoes'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

const usuario = vi.hoisted(() => ({ atual: { id: 'u1' } as { id: string } | null }))
vi.mock('./useAuth', () => ({ useAuth: () => ({ user: usuario.atual }) }))

describe('useConfirmacoes', () => {
  beforeEach(() => {
    usuario.atual = { id: 'u1' }
    vi.mocked(supabase.from).mockReset()
    vi.mocked(supabase.rpc).mockReset()
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ data: [{ denuncia_id: 'd1' }], error: null }) as never
    )
  })

  it('carrega as denúncias que a pessoa já confirmou', async () => {
    const { result } = renderHook(() => useConfirmacoes())

    await waitFor(() => expect(result.current.confirmadas.has('d1')).toBe(true))
    expect(result.current.logado).toBe(true)
  })

  it('não consulta nada sem login', () => {
    usuario.atual = null
    const { result } = renderHook(() => useConfirmacoes())

    expect(supabase.from).not.toHaveBeenCalled()
    expect(result.current.logado).toBe(false)
  })

  it('confirma uma denúncia, marca como confirmada e informa o novo total', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [{ confirmado: true, total: 4 }],
      error: null,
    } as never)
    const aoAlterar = vi.fn()
    const { result } = renderHook(() => useConfirmacoes(aoAlterar))

    await act(() => result.current.alternar('d2'))

    expect(supabase.rpc).toHaveBeenCalledWith('alternar_confirmacao', { p_denuncia_id: 'd2' })
    expect(result.current.confirmadas.has('d2')).toBe(true)
    expect(aoAlterar).toHaveBeenCalledWith('d2', 4)
  })

  it('desfaz a confirmação', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [{ confirmado: false, total: 0 }],
      error: null,
    } as never)
    const { result } = renderHook(() => useConfirmacoes())
    await waitFor(() => expect(result.current.confirmadas.has('d1')).toBe(true))

    await act(() => result.current.alternar('d1'))

    expect(result.current.confirmadas.has('d1')).toBe(false)
  })

  it('avisa quando tenta confirmar a própria denúncia', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'não é possível confirmar a própria denúncia' },
    } as never)
    const aoAlterar = vi.fn()
    const { result } = renderHook(() => useConfirmacoes(aoAlterar))

    await act(() => result.current.alternar('d9'))

    expect(result.current.erro).toBe('Você não pode confirmar a sua própria denúncia.')
    expect(result.current.confirmadas.has('d9')).toBe(false)
    expect(aoAlterar).not.toHaveBeenCalled()
  })
})
