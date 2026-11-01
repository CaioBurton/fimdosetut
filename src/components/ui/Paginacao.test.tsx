import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Paginacao } from './Paginacao'

describe('Paginacao', () => {
  it('não aparece quando há só uma página', () => {
    render(<Paginacao pagina={1} totalPaginas={1} onChange={() => {}} />)

    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument()
  })

  it('mostra a página atual e desabilita "Anterior" na primeira', () => {
    render(<Paginacao pagina={1} totalPaginas={3} onChange={() => {}} />)

    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Próxima/ })).toBeEnabled()
  })

  it('desabilita "Próxima" na última página e navega com os botões', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Paginacao pagina={3} totalPaginas={3} onChange={onChange} />)

    expect(screen.getByRole('button', { name: /Próxima/ })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Anterior/ }))

    expect(onChange).toHaveBeenCalledWith(2)
  })
})
