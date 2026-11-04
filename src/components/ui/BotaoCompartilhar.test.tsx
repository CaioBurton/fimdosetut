import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { compartilharImagem } from '../../lib/cartaoCompartilhavel'
import { BotaoCompartilhar } from './BotaoCompartilhar'

vi.mock('../../lib/cartaoCompartilhavel', () => ({ compartilharImagem: vi.fn() }))

const imagem = new Blob(['x'], { type: 'image/png' })

function renderizar(gerar = vi.fn().mockResolvedValue(imagem)) {
  render(<BotaoCompartilhar gerar={gerar} nomeArquivo="a.png" titulo="Deu o Prego!" texto="texto" />)
  return gerar
}

describe('BotaoCompartilhar', () => {
  beforeEach(() => {
    vi.mocked(compartilharImagem).mockReset()
  })

  it('gera a imagem e compartilha com o título e o texto', async () => {
    vi.mocked(compartilharImagem).mockResolvedValue('compartilhado')
    const user = userEvent.setup()
    const gerar = renderizar()

    await user.click(screen.getByRole('button', { name: 'Compartilhar' }))

    await waitFor(() => expect(compartilharImagem).toHaveBeenCalledWith(imagem, 'a.png', { titulo: 'Deu o Prego!', texto: 'texto' }))
    expect(gerar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('avisa que a imagem foi salva quando o aparelho só baixa o arquivo', async () => {
    vi.mocked(compartilharImagem).mockResolvedValue('baixado')
    const user = userEvent.setup()
    renderizar()

    await user.click(screen.getByRole('button', { name: 'Compartilhar' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Imagem salva')
  })

  it('mostra erro quando não consegue gerar a imagem', async () => {
    const user = userEvent.setup()
    renderizar(vi.fn().mockRejectedValue(new Error('falhou')))

    await user.click(screen.getByRole('button', { name: 'Compartilhar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível gerar a imagem.')
    expect(compartilharImagem).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeEnabled()
  })

  it('fica desabilitado enquanto gera', async () => {
    let liberar: (b: Blob) => void = () => {}
    const gerar = vi.fn(() => new Promise<Blob>((resolve) => { liberar = resolve }))
    vi.mocked(compartilharImagem).mockResolvedValue('compartilhado')
    const user = userEvent.setup()
    renderizar(gerar)

    await user.click(screen.getByRole('button', { name: 'Compartilhar' }))

    expect(screen.getByRole('button', { name: 'Gerando...' })).toBeDisabled()
    liberar(imagem)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeEnabled())
  })
})
