import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../../test/supabaseMock'
import { restaurarLargura, simularDesktop } from '../../test/desktop'
import { AuthProvider } from '../../hooks/useAuth'
import { PaginaLegal } from './PaginaLegal'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

function renderizar() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <PaginaLegal
          tituloLayout="Privacidade"
          titulo="Política de Privacidade"
          introducao={<p>Introdução</p>}
          secoes={[
            { titulo: 'Primeira', conteudo: <p>a</p> },
            { titulo: 'Segunda', conteudo: <p>b</p> },
          ]}
          outro={{ rotulo: 'Ler os Termos', para: '/termos' }}
        />
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('PaginaLegal', () => {
  afterEach(restaurarLargura)

  it('no celular não mostra o índice lateral', () => {
    renderizar()
    expect(screen.queryByRole('navigation', { name: 'Neste documento' })).not.toBeInTheDocument()
  })

  it('no desktop mostra o índice lateral com link para cada seção', () => {
    simularDesktop()
    renderizar()
    const indice = screen.getByRole('navigation', { name: 'Neste documento' })
    expect(indice).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '2. Segunda' })).toHaveAttribute('href', '#secao-legal-1')
    expect(screen.getByRole('link', { name: '← Voltar ao app' })).toHaveAttribute('href', '/')
  })
})
