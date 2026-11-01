import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../../test/supabaseMock'
import { supabase } from '../../lib/supabaseClient'
import { EnviarFeedback } from './EnviarFeedback'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

describe('EnviarFeedback', () => {
  beforeEach(() => vi.mocked(supabase.from).mockReset())

  it('envia o feedback com o tipo escolhido e limpa o campo', async () => {
    const cadeia = createChainable({ error: null })
    vi.mocked(supabase.from).mockReturnValue(cadeia as never)
    const user = userEvent.setup()
    render(<EnviarFeedback userId="u1" />)

    await user.click(screen.getByRole('radio', { name: 'Problema no app' }))
    await user.type(screen.getByLabelText('Mensagem'), '  O mapa travou  ')
    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))

    expect(supabase.from).toHaveBeenCalledWith('feedbacks')
    expect(cadeia.insert).toHaveBeenCalledWith({
      user_id: 'u1',
      tipo: 'problema',
      mensagem: 'O mapa travou',
    })
    expect(await screen.findByText('Obrigado! Seu feedback foi enviado.')).toBeInTheDocument()
    expect(screen.getByLabelText('Mensagem')).toHaveValue('')
  })

  it('usa "Sugestão" como tipo padrão', async () => {
    const cadeia = createChainable({ error: null })
    vi.mocked(supabase.from).mockReturnValue(cadeia as never)
    const user = userEvent.setup()
    render(<EnviarFeedback userId="u1" />)

    await user.type(screen.getByLabelText('Mensagem'), 'Ideia')
    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))

    expect(cadeia.insert).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'sugestao' }))
  })

  it('não envia mensagem vazia', async () => {
    const user = userEvent.setup()
    render(<EnviarFeedback userId="u1" />)

    await user.type(screen.getByLabelText('Mensagem'), '   ')
    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Escreva sua mensagem antes de enviar.')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('mostra erro e mantém o texto quando o envio falha', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ error: { message: 'rls' } }) as never
    )
    const user = userEvent.setup()
    render(<EnviarFeedback userId="u1" />)

    await user.type(screen.getByLabelText('Mensagem'), 'Quero ajudar')
    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível enviar seu feedback. Tente novamente.'
    )
    expect(screen.getByLabelText('Mensagem')).toHaveValue('Quero ajudar')
  })
})
