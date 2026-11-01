import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../test/supabaseMock'
import { AuthProvider } from '../hooks/useAuth'
import { definirAvisoLogin, lerAvisoLogin, limparAvisoLogin } from '../lib/avisoLogin'
import { supabase } from '../lib/supabaseClient'
import { LoginPage } from './LoginPage'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Mapa</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('LoginPage (integração: UI + useAuth + Supabase)', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.signInWithPassword).mockReset()
  })

  it('mostra "E-mail ou senha inválidos" quando o Supabase recusa as credenciais', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    } as never)
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('E-mail'), 'teste@exemplo.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'senhaerrada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument()
  })

  it('mostra uma mensagem de conexão quando a falha não é de credenciais', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: { message: 'TypeError: Failed to fetch' },
    } as never)
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('E-mail'), 'teste@exemplo.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'qualquersenha')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(
      await screen.findByText('Não foi possível entrar agora. Verifique sua conexão e tente novamente.')
    ).toBeInTheDocument()
  })

  it('navega para a rota inicial após um login bem-sucedido', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ error: null } as never)
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('E-mail'), 'teste@exemplo.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'senhacorreta')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Mapa')).toBeInTheDocument()
  })

  it('mostra o recado deixado por outra tela (conta excluída) e o apaga depois de lido', () => {
    definirAvisoLogin('Sua conta foi excluída e os seus dados foram apagados.')

    renderLogin()

    expect(screen.getByRole('status')).toHaveTextContent('Sua conta foi excluída')
    expect(lerAvisoLogin()).toBeNull()
  })

  it('não mostra recado quando ninguém deixou um', () => {
    limparAvisoLogin()

    renderLogin()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
