import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../hooks/useAuth'
import { useAceiteDocumentos } from '../../hooks/useAceiteDocumentos'
import { AceiteDocumentos } from './AceiteDocumentos'

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../../hooks/useAceiteDocumentos', () => ({ useAceiteDocumentos: vi.fn() }))

const signOut = vi.fn()
const aceitar = vi.fn()

function montar(opcoes: {
  precisaAceitar: boolean
  rota?: string
  erro?: string | null
  user?: { id: string } | null
}) {
  vi.mocked(useAuth).mockReturnValue({
    user: opcoes.user === undefined ? { id: 'u1' } : opcoes.user,
    signOut,
  } as unknown as ReturnType<typeof useAuth>)
  vi.mocked(useAceiteDocumentos).mockReturnValue({
    precisaAceitar: opcoes.precisaAceitar,
    aceitar,
    salvando: false,
    erro: opcoes.erro ?? null,
  })
  render(
    <MemoryRouter initialEntries={[opcoes.rota ?? '/']}>
      <AceiteDocumentos />
    </MemoryRouter>
  )
}

describe('AceiteDocumentos', () => {
  beforeEach(() => {
    signOut.mockReset()
    aceitar.mockReset()
  })

  it('pede o aceite, com links para os documentos, a quem ainda não aceitou', () => {
    montar({ precisaAceitar: true })

    expect(screen.getByRole('dialog', { name: 'Atualizamos nossos documentos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/privacidade')
    expect(screen.getByRole('link', { name: 'Termos de Uso' })).toHaveAttribute('target', '_blank')
  })

  it('registra o aceite ao concordar', async () => {
    const user = userEvent.setup()
    montar({ precisaAceitar: true })

    await user.click(screen.getByRole('button', { name: 'Li e concordo' }))

    expect(aceitar).toHaveBeenCalledTimes(1)
  })

  it('permite sair da conta quem não concorda', async () => {
    const user = userEvent.setup()
    montar({ precisaAceitar: true })

    await user.click(screen.getByRole('button', { name: 'Não concordo, sair da conta' }))

    expect(signOut).toHaveBeenCalled()
    expect(aceitar).not.toHaveBeenCalled()
  })

  it('mostra o erro quando não consegue registrar', () => {
    montar({ precisaAceitar: true, erro: 'Não foi possível registrar o seu aceite. Tente novamente.' })

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível registrar')
  })

  it('não aparece para quem já aceitou nem para visitante', () => {
    montar({ precisaAceitar: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('não cobre as páginas dos próprios documentos, para dar para lê-los', () => {
    montar({ precisaAceitar: true, rota: '/privacidade' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
