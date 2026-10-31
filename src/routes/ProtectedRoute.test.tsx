import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../hooks/useAuth')

function renderProtegida(rotaInicial = '/nova') {
  return render(
    <MemoryRouter initialEntries={[rotaInicial]}>
      <Routes>
        <Route path="/login" element={<p>Tela de login</p>} />
        <Route
          path="/nova"
          element={
            <ProtectedRoute>
              <p>Conteúdo protegido</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('mostra um indicador de carregamento enquanto a sessão ainda está sendo resolvida', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    renderProtegida()

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('redireciona para /login quando não há usuário autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    renderProtegida()

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('renderiza o conteúdo protegido quando há usuário autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      // @ts-expect-error -- apenas os campos usados pelo componente são necessários no teste
      user: { id: 'u1' },
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    renderProtegida()

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
  })
})
