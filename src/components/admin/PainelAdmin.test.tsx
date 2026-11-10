import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RESUMO_VAZIO } from '../../lib/resumoPainel'
import { PainelAdmin } from './PainelAdmin'

vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ isAdmin: false }) }))
vi.mock('../painel/DenunciasPorHora', () => ({ DenunciasPorHora: () => null }))
vi.mock('../painel/LinhaDaSemana', () => ({ LinhaDaSemana: () => null }))

const usePainelResumo = vi.fn()
vi.mock('../../hooks/usePainelResumo', () => ({
  usePainelResumo: (...args: unknown[]) => usePainelResumo(...args),
}))

beforeEach(() => {
  usePainelResumo.mockReset()
  usePainelResumo.mockReturnValue({ resumo: { ...RESUMO_VAZIO, total: 4, pendentes: 1, resolvidas: 3 }, loading: false, error: null })
})

describe('PainelAdmin', () => {
  it('usa o resumo do banco ("Tudo" por padrão) e pede 30 dias ao escolher esse período', async () => {
    const user = userEvent.setup()
    render(<PainelAdmin onGerenciarLinhas={() => {}} />)

    // O botão Semanal também pede o resumo de 7 dias, por isso confere as chamadas e não só a última.
    expect(usePainelResumo).toHaveBeenCalledWith('todos', 'todas')
    expect(screen.getByText('75% resolvidas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '30 dias' }))
    expect(usePainelResumo).toHaveBeenCalledWith('30d', 'todas')
  })

  it('pede o resumo da zona escolhida', async () => {
    const user = userEvent.setup()
    render(<PainelAdmin onGerenciarLinhas={() => {}} />)

    await user.click(screen.getByRole('button', { name: /Sul/ }))
    expect(usePainelResumo).toHaveBeenCalledWith('todos', 'sul')
  })

  it('mostra o erro de carregamento', () => {
    usePainelResumo.mockReturnValue({ resumo: RESUMO_VAZIO, loading: false, error: 'Não foi possível carregar o painel.' })
    render(<PainelAdmin onGerenciarLinhas={() => {}} />)
    expect(screen.getByText('Não foi possível carregar o painel.')).toBeInTheDocument()
  })

  it('leva para a aba de linhas pelo atalho do ranking', async () => {
    const user = userEvent.setup()
    const onGerenciarLinhas = vi.fn()
    usePainelResumo.mockReturnValue({
      resumo: { ...RESUMO_VAZIO, total: 1, topLinhas: [{ linhaId: 'l1', codigo: '063', nome: 'DIRCEU', total: 1 }] },
      loading: false,
      error: null,
    })
    render(<PainelAdmin onGerenciarLinhas={onGerenciarLinhas} />)

    await user.click(screen.getByRole('button', { name: 'Gerenciar linhas →' }))
    expect(onGerenciarLinhas).toHaveBeenCalled()
  })
})
