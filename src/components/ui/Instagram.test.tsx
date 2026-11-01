import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Instagram } from './Instagram'

describe('Instagram', () => {
  it('mostra o @ do fórum e abre o perfil em nova aba', () => {
    render(<Instagram />)

    const link = screen.getByRole('link', { name: /@fimdosetut/ })
    expect(link).toHaveTextContent('@fimdosetut')
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/fimdosetut/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})
