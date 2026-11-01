import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../hooks/useAuth'
import { VincularConta } from './VincularConta'

vi.mock('../../hooks/useAuth')

const vincularConta = vi.fn()

function preencher(user: ReturnType<typeof userEvent.setup>, senha = 'segredo123') {
  return (async () => {
    await user.type(screen.getByLabelText('Nome'), 'Maria')
    await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com')
    await user.type(screen.getByLabelText('Senha'), senha)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
  })()
}

describe('VincularConta', () => {
  beforeEach(() => {
    vincularConta.mockReset().mockResolvedValue({ error: null })
    vi.mocked(useAuth).mockReturnValue({
      // @ts-expect-error -- apenas os campos usados pelo componente são necessários no teste
      user: { id: 'u1' },
      session: null,
      loading: false,
      isAdmin: false,
      isAnonymous: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInAnonimo: vi.fn(),
      vincularConta,
      signOut: vi.fn(),
    })
  })

  it('liga a conta à sessão atual e avisa que as denúncias foram mantidas', async () => {
    const user = userEvent.setup()
    const onConcluido = vi.fn()
    render(<VincularConta onConcluido={onConcluido} />)

    await preencher(user)

    expect(vincularConta).toHaveBeenCalledWith('maria@exemplo.com', 'segredo123', 'Maria')
    expect(await screen.findByRole('status')).toHaveTextContent(/denúncias já estão ligadas/)
    expect(onConcluido).toHaveBeenCalled()
  })

  it('mostra o erro devolvido pelo servidor', async () => {
    vincularConta.mockResolvedValue({ error: 'A user with this email address has already been registered' })
    const user = userEvent.setup()
    render(<VincularConta />)

    await preencher(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(/already been registered/)
  })
})
