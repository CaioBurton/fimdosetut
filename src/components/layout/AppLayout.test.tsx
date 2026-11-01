import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../../test/supabaseMock'
import { AuthProvider } from '../../hooks/useAuth'
import { AppLayout } from './AppLayout'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

function simularLargura(desktop: boolean) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: desktop,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as never
}

function renderizar() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <AppLayout title="Lista">
          <p>conteúdo</p>
        </AppLayout>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('AppLayout', () => {
  afterEach(() => {
    // @ts-expect-error volta ao ambiente sem matchMedia
    delete window.matchMedia
  })

  it('usa a barra de baixo no celular', () => {
    simularLargura(false)
    renderizar()
    expect(screen.getByRole('heading', { name: 'Lista' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
  })

  it('usa o menu lateral no desktop, sem a barra de baixo', () => {
    simularLargura(true)
    renderizar()
    const menu = screen.getByRole('navigation', { name: 'Principal' })
    expect(menu).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reportar' })).toHaveAttribute('href', '/nova')
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })
})
