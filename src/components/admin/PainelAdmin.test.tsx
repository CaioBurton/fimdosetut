import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Denuncia } from '../../types'
import { PainelAdmin } from './PainelAdmin'

const hoje = new Date().toISOString()
const antigo = new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString()

function d(p: Partial<Denuncia> & { id: string }): Denuncia {
  return {
    user_id: 'u1',
    linha_id: 'l1',
    tipo: 'quebrado',
    status: 'pendente',
    descricao: 'x',
    latitude: 0,
    longitude: 0,
    created_at: hoje,
    updated_at: hoje,
    linha: { id: 'l1', codigo: '063', nome: 'DIRCEU', zona: 'leste' },
    ...p,
  }
}

const dados = [
  d({ id: '1' }),
  d({ id: '2', status: 'resolvido' }),
  d({ id: '3', created_at: antigo, linha_id: 'l2', linha: { id: 'l2', codigo: '801', nome: 'SANTA FE', zona: 'sul' } }),
]

describe('PainelAdmin', () => {
  it('mostra o resumo do período (30 dias por padrão) e muda ao escolher "Tudo"', async () => {
    const user = userEvent.setup()
    render(<PainelAdmin denuncias={dados} onGerenciarLinhas={() => {}} />)

    const resumo = screen.getByRole('region', { name: 'Resumo' })
    expect(within(resumo).getByText('1')).toBeInTheDocument() // pendentes
    expect(within(resumo).getByText('50% resolvidas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tudo' }))
    expect(within(resumo).getByText('de 3 denúncias no período')).toBeInTheDocument()
  })

  it('filtra por zona', async () => {
    const user = userEvent.setup()
    render(<PainelAdmin denuncias={dados} onGerenciarLinhas={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Tudo' }))
    await user.click(screen.getByRole('button', { name: /Sul/ }))

    expect(screen.getByText('de 1 denúncia no período')).toBeInTheDocument()
  })

  it('leva para a aba de linhas pelo atalho do ranking', async () => {
    const user = userEvent.setup()
    const onGerenciarLinhas = vi.fn()
    render(<PainelAdmin denuncias={dados} onGerenciarLinhas={onGerenciarLinhas} />)

    await user.click(screen.getByRole('button', { name: 'Gerenciar linhas →' }))

    expect(onGerenciarLinhas).toHaveBeenCalled()
  })
})
