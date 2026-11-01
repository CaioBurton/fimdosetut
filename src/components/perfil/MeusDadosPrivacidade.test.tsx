import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../../test/supabaseMock'
import { useAuth } from '../../hooks/useAuth'
import { limparAvisoLogin, lerAvisoLogin } from '../../lib/avisoLogin'
import { baixarJson } from '../../lib/baixarArquivo'
import { supabase } from '../../lib/supabaseClient'
import { MeusDadosPrivacidade } from './MeusDadosPrivacidade'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../../lib/baixarArquivo', () => ({ baixarJson: vi.fn() }))

const signOut = vi.fn().mockResolvedValue(undefined)

function TelaLogin() {
  return <p>Tela de login: {lerAvisoLogin()}</p>
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/minhas']}>
      <Routes>
        <Route path="/minhas" element={<MeusDadosPrivacidade />} />
        <Route path="/login" element={<TelaLogin />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('MeusDadosPrivacidade', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset()
    vi.mocked(baixarJson).mockReset()
    signOut.mockReset()
    signOut.mockResolvedValue(undefined)
    limparAvisoLogin()
    vi.mocked(useAuth).mockReturnValue({ signOut } as unknown as ReturnType<typeof useAuth>)
  })

  it('baixa uma cópia dos dados em arquivo JSON', async () => {
    const dados = { conta: { email: 'a@b.com' }, denuncias: [] }
    vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data: dados, error: null }) as never)
    const user = userEvent.setup()
    renderizar()

    await user.click(screen.getByRole('button', { name: 'Baixar meus dados' }))

    expect(supabase.rpc).toHaveBeenCalledWith('exportar_meus_dados')
    expect(baixarJson).toHaveBeenCalledWith(
      expect.stringMatching(/^meus-dados-deu-o-prego-\d{4}-\d{2}-\d{2}\.json$/),
      dados
    )
  })

  it('avisa quando não consegue gerar a cópia', async () => {
    vi.mocked(supabase.rpc).mockReturnValue(
      Promise.resolve({ data: null, error: { message: 'x' } }) as never
    )
    const user = userEvent.setup()
    renderizar()

    await user.click(screen.getByRole('button', { name: 'Baixar meus dados' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível gerar a cópia')
    expect(baixarJson).not.toHaveBeenCalled()
  })

  it('exige confirmar digitando EXCLUIR antes de apagar a conta', async () => {
    const user = userEvent.setup()
    renderizar()

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    const botao = screen.getByRole('button', { name: 'Excluir definitivamente' })
    expect(botao).toBeDisabled()

    await user.type(screen.getByLabelText(/Digite EXCLUIR/), 'excluir pls')
    expect(botao).toBeDisabled()
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('exclui a conta, sai do app e avisa na tela de login', async () => {
    vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data: null, error: null }) as never)
    const user = userEvent.setup()
    renderizar()

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await user.type(screen.getByLabelText(/Digite EXCLUIR/), 'excluir')
    await user.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))

    expect(supabase.rpc).toHaveBeenCalledWith('excluir_minha_conta')
    expect(await screen.findByText(/Tela de login: Sua conta foi excluída/)).toBeInTheDocument()
    expect(signOut).toHaveBeenCalled()
  })

  it('mantém o aviso mesmo quando a tela protegida redireciona ao perder a sessão', async () => {
    vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data: null, error: null }) as never)
    // Simula o ProtectedRoute: ao sair da conta, a tela do Perfil manda para o login sem aviso.
    let sair: () => void = () => {}
    signOut.mockImplementation(async () => sair())
    function Protegida() {
      const [logado, setLogado] = useState(true)
      sair = () => setLogado(false)
      return logado ? <MeusDadosPrivacidade /> : <Navigate to="/login" replace />
    }
    render(
      <MemoryRouter initialEntries={['/minhas']}>
        <Routes>
          <Route path="/minhas" element={<Protegida />} />
          <Route path="/login" element={<TelaLogin />} />
        </Routes>
      </MemoryRouter>
    )
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await user.type(screen.getByLabelText(/Digite EXCLUIR/), 'EXCLUIR')
    await user.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))

    expect(await screen.findByText(/Tela de login: Sua conta foi excluída/)).toBeInTheDocument()
  })

  it('explica quando o único administrador tenta excluir a conta', async () => {
    vi.mocked(supabase.rpc).mockReturnValue(
      Promise.resolve({ data: null, error: { message: 'único administrador' } }) as never
    )
    const user = userEvent.setup()
    renderizar()

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await user.type(screen.getByLabelText(/Digite EXCLUIR/), 'EXCLUIR')
    await user.click(screen.getByRole('button', { name: 'Excluir definitivamente' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('único administrador')
    expect(signOut).not.toHaveBeenCalled()
  })

  it('permite cancelar a exclusão', async () => {
    const user = userEvent.setup()
    renderizar()

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('button', { name: 'Excluir minha conta' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/Digite EXCLUIR/)).not.toBeInTheDocument()
  })
})
