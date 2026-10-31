import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Linha } from '../../types'
import { LinhaSelect } from './LinhaSelect'

const linhas: Linha[] = [
  { id: '1', codigo: '303', nome: 'SANTA SOFIA', zona: 'norte' },
  { id: '2', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte' },
  { id: '3', codigo: '801', nome: 'SANTA FE', zona: 'sul' },
  { id: '4', codigo: '100', nome: 'REDONDA', zona: 'sudeste' },
]

describe('LinhaSelect', () => {
  it('agrupa as linhas por zona, na ordem Norte, Sul, Leste, Sudeste, Outras', () => {
    render(<LinhaSelect linhas={linhas} value="" onChange={() => {}} />)

    const grupos = screen
      .getAllByRole('group')
      .map((g) => g.getAttribute('label'))

    expect(grupos).toEqual(['Zona Norte', 'Zona Sul', 'Zona Sudeste'])
  })

  it('não renderiza optgroup para zonas sem nenhuma linha', () => {
    render(<LinhaSelect linhas={linhas} value="" onChange={() => {}} />)

    expect(screen.queryByText('Zona Leste')).not.toBeInTheDocument()
    expect(screen.queryByText('Zona Outras')).not.toBeInTheDocument()
  })

  it('lista o código e o nome de cada linha dentro do seu grupo', () => {
    render(<LinhaSelect linhas={linhas} value="" onChange={() => {}} />)

    expect(screen.getByRole('option', { name: '303 - SANTA SOFIA' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '801 - SANTA FE' })).toBeInTheDocument()
  })

  it('chama onChange com o id da linha selecionada', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LinhaSelect linhas={linhas} value="" onChange={onChange} />)

    await user.selectOptions(screen.getByRole('combobox'), '801 - SANTA FE')

    expect(onChange).toHaveBeenCalledWith('3')
  })
})
