import { render, screen } from '@testing-library/react'
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
})
