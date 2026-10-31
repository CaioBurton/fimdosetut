import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../test/supabaseMock'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { MinhasDenunciasPage } from './MinhasDenunciasPage'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))
vi.mock('../hooks/useAuth')

const linhasFalsas = [{ id: 'l1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte' }]

function denunciaDoUsuario(sobrescrever: Record<string, unknown> = {}) {
  return {
    id: 'd1',
    user_id: 'u1',
    linha_id: 'l1',
    tipo: 'quebrado',
    status: 'pendente',
    descricao: 'Ônibus parado.',
    latitude: -5.09,
    longitude: -42.8,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    linha: linhasFalsas[0],
    ...sobrescrever,
  }
}

function mockarUsuarioLogado() {
  vi.mocked(useAuth).mockReturnValue({
    // @ts-expect-error -- apenas os campos usados pelo componente são necessários no teste
    user: { id: 'u1' },
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })
}

function renderPagina() {
  return render(
    <MemoryRouter>
      <MinhasDenunciasPage />
    </MemoryRouter>
  )
}

describe('MinhasDenunciasPage (integração: UI + hooks + Supabase)', () => {
  beforeEach(() => {
    mockarUsuarioLogado()
    vi.mocked(supabase.from).mockReset()
  })

  it('mostra apenas as denúncias do usuário logado', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(createChainable({ data: linhasFalsas, error: null }) as never)
      .mockReturnValueOnce(
        createChainable({
          data: [denunciaDoUsuario(), denunciaDoUsuario({ id: 'd2', user_id: 'outro-usuario' })],
          error: null,
        }) as never
      )

    renderPagina()

    expect(await screen.findByText('103 - MOCAMBINHO')).toBeInTheDocument()
    expect(screen.getAllByText('103 - MOCAMBINHO')).toHaveLength(1)
  })

  it('mostra estado vazio quando o usuário não tem denúncias', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(createChainable({ data: linhasFalsas, error: null }) as never)
      .mockReturnValueOnce(createChainable({ data: [], error: null }) as never)

    renderPagina()

    expect(await screen.findByText('Você ainda não enviou nenhuma denúncia.')).toBeInTheDocument()
  })

  it('marca uma denúncia pendente como resolvida', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(createChainable({ data: linhasFalsas, error: null }) as never)
      .mockReturnValueOnce(createChainable({ data: [denunciaDoUsuario()], error: null }) as never)
      .mockReturnValueOnce(createChainable({ error: null }) as never)

    const user = userEvent.setup()
    renderPagina()

    await screen.findByText('103 - MOCAMBINHO')
    await user.click(screen.getByRole('button', { name: 'Marcar resolvido' }))

    const chainDaAcao = vi.mocked(supabase.from).mock.results[2].value
    expect(chainDaAcao.update).toHaveBeenCalledWith({ status: 'resolvido' })
    expect(chainDaAcao.eq).toHaveBeenCalledWith('id', 'd1')
  })

  it('mostra uma mensagem de erro quando a exclusão falha', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(createChainable({ data: linhasFalsas, error: null }) as never)
      .mockReturnValueOnce(createChainable({ data: [denunciaDoUsuario()], error: null }) as never)
      .mockReturnValueOnce(createChainable({ error: { message: 'falhou' } }) as never)

    const user = userEvent.setup()
    renderPagina()

    await screen.findByText('103 - MOCAMBINHO')
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(
      await screen.findByText('Não foi possível excluir a denúncia. Tente novamente.')
    ).toBeInTheDocument()
  })
})
