import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BotaoTambemVi } from './BotaoTambemVi'

describe('BotaoTambemVi', () => {
  it('mostra o total de confirmações quando há alguma', () => {
    render(<BotaoTambemVi total={3} confirmado={false} onClick={() => {}} />)

    expect(screen.getByRole('button', { name: /Também vi/ })).toHaveTextContent('Também vi · 3')
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('não mostra número quando ninguém confirmou', () => {
    render(<BotaoTambemVi total={0} confirmado={false} onClick={() => {}} />)

    expect(screen.getByRole('button')).toHaveTextContent(/^Também vi$/)
  })

  it('aparece marcado quando a pessoa já confirmou', () => {
    render(<BotaoTambemVi total={1} confirmado onClick={() => {}} />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button')).toHaveTextContent('✓ Também vi')
  })

  it('chama onClick e fica desabilitado enquanto carrega', () => {
    const onClick = vi.fn()
    const { rerender } = render(<BotaoTambemVi total={0} confirmado={false} onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(<BotaoTambemVi total={0} confirmado={false} carregando onClick={onClick} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
