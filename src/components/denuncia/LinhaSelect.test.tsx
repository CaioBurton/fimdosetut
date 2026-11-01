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

async function abrir(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: 'Linha' }))
}

describe('LinhaSelect', () => {
  it('começa fechado e mostra o placeholder', () => {
    render(<LinhaSelect linhas={linhas} value="" onChange={() => {}} />)

    expect(screen.getByText('Selecione a linha do ônibus')).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('agrupa as linhas por zona, na ordem Norte, Sul, Leste, Sudeste, Outras', async () => {
    const user = userEvent.setup()
    render(<LinhaSelect linhas={linhas} value="" onChange={() => {}} />)
    await abrir(user)

    const grupos = screen.getAllByRole('group').map((g) => g.getAttribute('aria-label'))

    expect(grupos).toEqual(['Zona Norte', 'Zona Sul', 'Zona Sudeste'])
    expect(screen.queryByText('Zona Leste')).not.toBeInTheDocument()
    expect(screen.queryByText('Zona Outras')).not.toBeInTheDocument()
  })

  it('lista o código e o nome de cada linha', async () => {
    const user = userEvent.setup()
    render(<LinhaSelect linhas={linhas} value="" onChange={() => {}} />)
    await abrir(user)

    expect(screen.getByRole('option', { name: /303.*SANTA SOFIA/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /801.*SANTA FE/ })).toBeInTheDocument()
  })

  it('filtra por número ou nome, ignorando acentos e maiúsculas', async () => {
    const user = userEvent.setup()
    render(<LinhaSelect linhas={linhas} value="" onChange={() => {}} />)
    await abrir(user)

    await user.type(screen.getByRole('searchbox', { name: 'Buscar linha' }), 'sofia')
    expect(screen.getAllByRole('option')).toHaveLength(1)

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar linha' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar linha' }), '801')
    expect(screen.getByRole('option', { name: /SANTA FE/ })).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar linha' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar linha' }), 'xyz')
    expect(screen.getByText('Nenhuma linha encontrada.')).toBeInTheDocument()
  })

  it('chama onChange com o id da linha escolhida e fecha a lista', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LinhaSelect linhas={linhas} value="" onChange={onChange} />)
    await abrir(user)

    await user.click(screen.getByRole('option', { name: /801.*SANTA FE/ }))

    expect(onChange).toHaveBeenCalledWith('3')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('mostra a linha selecionada no botão', () => {
    render(<LinhaSelect linhas={linhas} value="3" onChange={() => {}} />)

    expect(screen.getByRole('combobox', { name: 'Linha' })).toHaveTextContent('801')
    expect(screen.getByRole('combobox', { name: 'Linha' })).toHaveTextContent('SANTA FE')
  })

  it('fecha com Escape', async () => {
    const user = userEvent.setup()
    render(<LinhaSelect linhas={linhas} value="" onChange={() => {}} />)
    await abrir(user)

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
