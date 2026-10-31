import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../test/supabaseMock'
import { AuthProvider } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { CadastroPage } from './CadastroPage'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

function renderCadastro() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/cadastro']}>
        <Routes>
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/login" element={<p>Tela de login</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('CadastroPage (integração: UI + useAuth + Supabase)', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.signUp).mockReset()
  })

  it('bloqueia o envio com senha curta sem chamar o Supabase', async () => {
    const user = userEvent.setup()
    renderCadastro()

    await user.type(screen.getByPlaceholderText('E-mail'), 'teste@exemplo.com')
    await user.type(screen.getByPlaceholderText('Senha (mínimo 6 caracteres)'), '123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByText('A senha precisa ter pelo menos 6 caracteres.')).toBeInTheDocument()
    expect(supabase.auth.signUp).not.toHaveBeenCalled()
  })

  it('mostra uma mensagem amigável quando a criação da conta falha por conexão', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      error: { message: 'TypeError: Failed to fetch' },
    } as never)
    const user = userEvent.setup()
    renderCadastro()

    await user.type(screen.getByPlaceholderText('E-mail'), 'teste@exemplo.com')
    await user.type(screen.getByPlaceholderText('Senha (mínimo 6 caracteres)'), 'senha123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(
      await screen.findByText(
        'Não foi possível criar a conta agora. Verifique sua conexão e tente novamente.'
      )
    ).toBeInTheDocument()
  })

  it('repassa o erro específico do Supabase quando não é uma falha de conexão', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      error: { message: 'User already registered' },
    } as never)
    const user = userEvent.setup()
    renderCadastro()

    await user.type(screen.getByPlaceholderText('E-mail'), 'teste@exemplo.com')
    await user.type(screen.getByPlaceholderText('Senha (mínimo 6 caracteres)'), 'senha123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('User already registered')).toBeInTheDocument()
  })

  it('mostra a mensagem de sucesso com e-mail e senha válidos', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ error: null } as never)
    const user = userEvent.setup()
    renderCadastro()

    await user.type(screen.getByPlaceholderText('E-mail'), 'teste@exemplo.com')
    await user.type(screen.getByPlaceholderText('Senha (mínimo 6 caracteres)'), 'senha123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText(/Conta criada!/)).toBeInTheDocument()
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'teste@exemplo.com',
      password: 'senha123',
    })
  })
})
