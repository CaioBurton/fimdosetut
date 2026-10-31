import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { useAuth } from '../hooks/useAuth'
import { AdminRoute } from './AdminRoute'

vi.mock('../hooks/useAuth')

function mockarAuth(parcial: { user: object | null; isAdmin: boolean; loading?: boolean }) {
  vi.mocked(useAuth).mockReturnValue({
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    ...parcial,
  } as unknown as ReturnType<typeof useAuth>)
}

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/" element={<p>Mapa</p>} />
        <Route path="/login" element={<p>Tela de login</p>} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <p>Painel admin</p>
            </AdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminRoute', () => {
  it('mostra carregamento enquanto o papel do usuário não foi resolvido', () => {
    mockarAuth({ user: null, isAdmin: false, loading: true })
    renderAdmin()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('redireciona visitante não logado para o login', () => {
    mockarAuth({ user: null, isAdmin: false })
    renderAdmin()
    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('redireciona usuário comum para o mapa', () => {
    mockarAuth({ user: { id: 'u1' }, isAdmin: false })
    renderAdmin()
    expect(screen.getByText('Mapa')).toBeInTheDocument()
    expect(screen.queryByText('Painel admin')).not.toBeInTheDocument()
  })

  it('libera o painel para admin', () => {
    mockarAuth({ user: { id: 'u1' }, isAdmin: true })
    renderAdmin()
    expect(screen.getByText('Painel admin')).toBeInTheDocument()
  })
})
