import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RESUMO_VAZIO } from '../../lib/resumoPainel'
import { BotaoCompartilharTudo } from './BotaoCompartilharTudo'

vi.mock('../../hooks/useRankingSemana', () => ({ useRankingSemana: () => ({ linhas: [], loading: false, error: false }) }))
const usePainelResumo = vi.fn(() => ({ resumo: RESUMO_VAZIO, loading: false, error: null }))
vi.mock('../../hooks/usePainelResumo', () => ({ usePainelResumo: (...args: [string, string]) => usePainelResumo(...args) }))
vi.mock('../../hooks/useLinhas', () => ({ useLinhas: () => ({ linhas: [] }) }))
vi.mock('../../hooks/useDenuncias', () => ({ useDenuncias: () => ({ denuncias: [], loading: false }) }))

describe('BotaoCompartilharTudo', () => {
  it('aparece para qualquer visitante', () => {
    render(<BotaoCompartilharTudo />)
    expect(screen.getByRole('button', { name: /Semanal/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Diário/ })).toBeEnabled()
  })

  it('o Semanal usa sempre os últimos 7 dias, sem depender do período do painel', () => {
    render(<BotaoCompartilharTudo />)
    expect(usePainelResumo).toHaveBeenCalledWith('7d', 'todas')
  })

  it.each(['Semanal', 'Diário'])('o %s deixa escolher entre post e story', async (nome) => {
    const user = userEvent.setup()
    render(<BotaoCompartilharTudo />)
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: new RegExp(nome) }))
    expect(screen.getByRole('menuitem', { name: 'Post (4:5)' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Story (9:16)' })).toBeInTheDocument()
  })

  it('fecha o seletor ao clicar em outro lugar da tela', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <p>fora</p>
        <BotaoCompartilharTudo />
      </div>
    )
    await user.click(screen.getByRole('button', { name: /Semanal/ }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(screen.getByText('fora'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('fecha o seletor com Esc', async () => {
    const user = userEvent.setup()
    render(<BotaoCompartilharTudo />)
    await user.click(screen.getByRole('button', { name: /Diário/ }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('abrir o seletor de um botão fecha o do outro', async () => {
    const user = userEvent.setup()
    render(<BotaoCompartilharTudo />)
    await user.click(screen.getByRole('button', { name: /Semanal/ }))
    await user.click(screen.getByRole('button', { name: /Diário/ }))
    expect(screen.getAllByRole('menu')).toHaveLength(1)
  })
})
