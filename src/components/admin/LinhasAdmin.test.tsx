import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Denuncia, Linha } from '../../types'
import { LinhasAdmin } from './LinhasAdmin'

const linhas: Linha[] = [
  { id: 'l1', codigo: '063', nome: 'DIRCEU / CENTRO', zona: 'leste' },
  { id: 'l2', codigo: '801', nome: 'SANTA FE', zona: 'sul' },
]

const denuncias = [{ id: 'd1', linha_id: 'l1' }] as Denuncia[]

function montar(props: Partial<React.ComponentProps<typeof LinhasAdmin>> = {}) {
  const acoes = {
    onCriar: vi.fn().mockResolvedValue(null),
    onAtualizar: vi.fn().mockResolvedValue(null),
    onExcluir: vi.fn().mockResolvedValue(null),
  }
  render(<LinhasAdmin linhas={linhas} denuncias={denuncias} {...acoes} {...props} />)
  return acoes
}

describe('LinhasAdmin', () => {
  it('lista as linhas com a contagem de denúncias e filtra pela busca', async () => {
    const user = userEvent.setup()
    montar()

    expect(screen.getByText('DIRCEU / CENTRO')).toBeInTheDocument()
    expect(screen.getByText(/Zona Leste · 1 denúncia$/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Buscar linha'), 'santa')

    expect(screen.queryByText('DIRCEU / CENTRO')).not.toBeInTheDocument()
    expect(screen.getByText('SANTA FE')).toBeInTheDocument()
  })

  it('bloqueia a exclusão de linha que tem denúncias', () => {
    montar()

    expect(screen.getByRole('button', { name: 'Excluir linha 063' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Excluir linha 801' })).toBeEnabled()
  })

  it('exclui uma linha sem denúncias depois de confirmar', async () => {
    const user = userEvent.setup()
    const { onExcluir } = montar()

    await user.click(screen.getByRole('button', { name: 'Excluir linha 801' }))
    expect(onExcluir).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }))

    expect(onExcluir).toHaveBeenCalledWith('l2')
  })

  it('cria uma linha pelo formulário', async () => {
    const user = userEvent.setup()
    const { onCriar } = montar()

    await user.click(screen.getByRole('button', { name: 'Nova linha' }))
    const dialogo = screen.getByRole('dialog')
    await user.type(within(dialogo).getByLabelText('Código'), '204')
    await user.type(within(dialogo).getByLabelText('Nome'), 'parque piauí')
    await user.click(within(dialogo).getByRole('radio', { name: /Sudeste/ }))
    await user.click(within(dialogo).getByRole('button', { name: 'Criar linha' }))

    expect(onCriar).toHaveBeenCalledWith({ codigo: '204', nome: 'PARQUE PIAUÍ', zona: 'sudeste' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('edita uma linha existente', async () => {
    const user = userEvent.setup()
    const { onAtualizar } = montar()

    await user.click(screen.getByRole('button', { name: 'Editar linha 801' }))
    const nome = screen.getByLabelText('Nome')
    await user.clear(nome)
    await user.type(nome, 'Santa Fé Nova')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onAtualizar).toHaveBeenCalledWith('l2', {
      codigo: '801',
      nome: 'SANTA FÉ NOVA',
      zona: 'sul',
    })
  })

  it('valida campos vazios e código duplicado sem chamar o servidor', async () => {
    const user = userEvent.setup()
    const { onCriar } = montar()

    await user.click(screen.getByRole('button', { name: 'Nova linha' }))
    await user.click(screen.getByRole('button', { name: 'Criar linha' }))
    expect(screen.getByText('Preencha o código e o nome da linha.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Código'), '063')
    await user.type(screen.getByLabelText('Nome'), 'Outra')
    await user.click(screen.getByRole('button', { name: 'Criar linha' }))
    expect(screen.getByText('Já existe uma linha com esse código.')).toBeInTheDocument()
    expect(onCriar).not.toHaveBeenCalled()
  })

  it('mantém o formulário aberto e mostra o erro quando o servidor recusa', async () => {
    const user = userEvent.setup()
    montar({ onCriar: vi.fn().mockResolvedValue('Não foi possível criar a linha. Tente novamente.') })

    await user.click(screen.getByRole('button', { name: 'Nova linha' }))
    await user.type(screen.getByLabelText('Código'), '999')
    await user.type(screen.getByLabelText('Nome'), 'Teste')
    await user.click(screen.getByRole('button', { name: 'Criar linha' }))

    expect(await screen.findByText('Não foi possível criar a linha. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
