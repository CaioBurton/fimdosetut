import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RESUMO_VAZIO } from '../../lib/resumoPainel'
import { BotaoCompartilharTudo } from './BotaoCompartilharTudo'

vi.mock('../../hooks/useRankingSemana', () => ({ useRankingSemana: () => ({ linhas: [], loading: false, error: false }) }))
vi.mock('../../hooks/useLinhas', () => ({ useLinhas: () => ({ linhas: [] }) }))
vi.mock('../../hooks/useDenuncias', () => ({ useDenuncias: () => ({ denuncias: [], loading: false }) }))

describe('BotaoCompartilharTudo', () => {
  it('aparece para qualquer visitante', () => {
    render(<BotaoCompartilharTudo resumo={RESUMO_VAZIO} periodo="7d" zona="todas" />)
    expect(screen.getByRole('button', { name: /Semanal/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Diário/ })).toBeEnabled()
  })

  it('o Diário deixa escolher entre post e story', async () => {
    const user = userEvent.setup()
    render(<BotaoCompartilharTudo resumo={RESUMO_VAZIO} periodo="7d" zona="todas" />)
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Diário/ }))
    expect(screen.getByRole('menuitem', { name: 'Post (4:5)' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Story (9:16)' })).toBeInTheDocument()
  })
})
