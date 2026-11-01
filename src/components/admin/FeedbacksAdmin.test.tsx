import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../../test/supabaseMock'
import { supabase } from '../../lib/supabaseClient'
import { FeedbacksAdmin } from './FeedbacksAdmin'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

const feedbacks = [
  {
    id: 'f1',
    user_id: 'u1',
    tipo: 'problema',
    mensagem: 'O mapa travou no celular.',
    created_at: '2026-11-01T12:00:00.000Z',
    perfil: { email: 'maria@email.com' },
  },
  {
    id: 'f2',
    user_id: null,
    tipo: 'elogio',
    mensagem: 'Gostei muito!',
    created_at: '2026-10-31T12:00:00.000Z',
    perfil: null,
  },
]

describe('FeedbacksAdmin', () => {
  beforeEach(() => vi.mocked(supabase.from).mockReset())

  it('lista os feedbacks com quem enviou e o tipo', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ data: feedbacks, error: null }) as never
    )
    render(<FeedbacksAdmin />)

    expect(await screen.findByText('O mapa travou no celular.')).toBeInTheDocument()
    expect(screen.getByText('maria@email.com')).toBeInTheDocument()
    expect(screen.getByText('Problema no app')).toBeInTheDocument()
    expect(screen.getByText('Conta removida')).toBeInTheDocument()
    expect(screen.getByText('Elogio')).toBeInTheDocument()
  })

  it('avisa quando não há feedbacks', async () => {
    vi.mocked(supabase.from).mockReturnValue(createChainable({ data: [], error: null }) as never)
    render(<FeedbacksAdmin />)

    expect(await screen.findByText('Nenhum feedback recebido ainda.')).toBeInTheDocument()
  })

  it('exclui um feedback depois de confirmar', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ data: feedbacks, error: null }) as never
    )
    const user = userEvent.setup()
    render(<FeedbacksAdmin />)
    await screen.findByText('Gostei muito!')

    await user.click(screen.getAllByRole('button', { name: 'Excluir' })[1])
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))

    expect(screen.queryByText('Gostei muito!')).not.toBeInTheDocument()
    expect(screen.getByText('O mapa travou no celular.')).toBeInTheDocument()
  })

  it('mostra erro quando não consegue carregar', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ error: { message: 'x' } }) as never
    )
    render(<FeedbacksAdmin />)

    expect(await screen.findByText('Não foi possível carregar os feedbacks.')).toBeInTheDocument()
  })
})
