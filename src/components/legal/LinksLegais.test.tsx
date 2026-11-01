import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LinksLegais } from './LinksLegais'

describe('LinksLegais', () => {
  it('leva para a política e para os termos', () => {
    render(
      <MemoryRouter>
        <LinksLegais />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade'
    )
    expect(screen.getByRole('link', { name: 'Termos de Uso' })).toHaveAttribute('href', '/termos')
    expect(screen.getByRole('link', { name: 'Termos de Uso' })).not.toHaveAttribute('target')
  })

  it('abre em nova aba, com segurança, quando pedido', () => {
    render(
      <MemoryRouter>
        <LinksLegais novaAba />
      </MemoryRouter>
    )

    const link = screen.getByRole('link', { name: 'Política de Privacidade' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})
