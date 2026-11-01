import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../hooks/useAuth'
import { BottomNav } from './BottomNav'

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

function montar(parcial: { user: object | null; isAdmin: boolean }) {
  vi.mocked(useAuth).mockReturnValue({
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    ...parcial,
  } as unknown as ReturnType<typeof useAuth>)
  render(
    <MemoryRouter>
      <BottomNav />
    </MemoryRouter>
  )
}

describe('BottomNav', () => {
  it('mostra "Painel" como quinto botão para visitante', () => {
    montar({ user: null, isAdmin: false })

    expect(screen.getAllByRole('link')).toHaveLength(5)
    expect(screen.getByRole('link', { name: 'Painel' })).toHaveAttribute('href', '/painel')
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('mostra "Painel" também para usuário comum logado', () => {
    montar({ user: { id: 'u1' }, isAdmin: false })

    expect(screen.getByRole('link', { name: 'Painel' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Perfil' })).toBeInTheDocument()
  })

  it('troca "Painel" por "Admin" para o administrador', () => {
    montar({ user: { id: 'u1' }, isAdmin: true })

    expect(screen.getAllByRole('link')).toHaveLength(5)
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument()
  })
})
