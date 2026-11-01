import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tutorial, TUTORIAL_KEY } from './Tutorial'

describe('Tutorial', () => {
  beforeEach(() => localStorage.clear())

  it('aparece na primeira visita e avança pelos passos', async () => {
    const user = userEvent.setup()
    render(<Tutorial />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Bem-vindo ao Deu o Prego!')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(screen.getByText('Veja o mapa')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByText('Bem-vindo ao Deu o Prego!')).toBeInTheDocument()
  })

  it('grava que foi visto ao concluir e não reaparece', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Tutorial />)

    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.click(screen.getByRole('button', { name: 'Começar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('1')

    unmount()
    render(<Tutorial />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('informa que os dados são protegidos pela LGPD', async () => {
    const user = userEvent.setup()
    render(<Tutorial />)

    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Próximo' }))

    expect(screen.getByText('Seus dados estão protegidos')).toBeInTheDocument()
    expect(screen.getByText(/LGPD/)).toBeInTheDocument()
  })

  it('permite pular', async () => {
    const user = userEvent.setup()
    render(<Tutorial />)

    await user.click(screen.getByRole('button', { name: 'Pular' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('1')
  })
})
