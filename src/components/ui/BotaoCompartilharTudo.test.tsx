import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RESUMO_VAZIO } from '../../lib/resumoPainel'
import { BotaoCompartilharTudo } from './BotaoCompartilharTudo'

const auth = vi.hoisted(() => ({ isAdmin: false }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => auth }))
vi.mock('../../hooks/useRankingSemana', () => ({ useRankingSemana: () => ({ linhas: [], loading: false, error: false }) }))

describe('BotaoCompartilharTudo', () => {
  beforeEach(() => {
    auth.isAdmin = false
  })

  it('não aparece para quem não é admin', () => {
    render(<BotaoCompartilharTudo resumo={RESUMO_VAZIO} periodo="7d" zona="todas" />)
    expect(screen.queryByRole('button', { name: /Tudo/ })).not.toBeInTheDocument()
  })

  it('aparece para admin', () => {
    auth.isAdmin = true
    render(<BotaoCompartilharTudo resumo={RESUMO_VAZIO} periodo="7d" zona="todas" />)
    expect(screen.getByRole('button', { name: /Tudo/ })).toBeEnabled()
  })
})
