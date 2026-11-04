import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../../test/supabaseMock'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Selos } from './Selos'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))
vi.mock('../../hooks/useAuth')

function mockarUsuario(logado = true) {
  vi.mocked(useAuth).mockReturnValue({ user: logado ? { id: 'u1' } : null } as unknown as ReturnType<typeof useAuth>)
}

function responder(data: unknown, error: { message: string } | null = null) {
  vi.mocked(supabase.rpc).mockReset()
  vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data, error }) as never)
}

describe('Selos (meu perfil)', () => {
  beforeEach(() => mockarUsuario())

  it('não aparece sem login e não consulta nada', () => {
    mockarUsuario(false)
    responder(null)
    const { container } = render(<Selos />)

    expect(container).toBeEmptyDOMElement()
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('explica que os selos são privados e não há ranking de pessoas', async () => {
    responder({ denuncias_confirmadas: 0, linhas: [], sequencia_atual: 0, melhor_sequencia: 0 })
    render(<Selos />)

    expect(await screen.findByText(/Só você vê estes selos/)).toBeInTheDocument()
    expect(screen.getByText(/Não existe ranking de pessoas/)).toBeInTheDocument()
    expect(supabase.rpc).toHaveBeenCalledWith('meus_selos')
  })

  it('mostra os selos conquistados e a sequência atual', async () => {
    responder({
      denuncias_confirmadas: 5,
      linhas: [{ linha_id: 'l1', codigo: '603', nome: 'Linha 603', confirmadas: 3 }],
      sequencia_atual: 4,
      melhor_sequencia: 4,
    })
    render(<Selos />)

    const conquistados = within(await screen.findByRole('list', { name: 'Selos conquistados' }))
    expect(conquistados.getByText('Voz ouvida')).toBeInTheDocument()
    expect(conquistados.getByText('Fiscal da linha 603')).toBeInTheDocument()
    expect(conquistados.getByText('3 dias seguidos')).toBeInTheDocument()
    expect(screen.getByText('Sequência atual: 4 dias colaborando')).toBeInTheDocument()
  })

  it('mostra o que está a caminho com a barra de progresso', async () => {
    responder({
      denuncias_confirmadas: 1,
      linhas: [{ linha_id: 'l1', codigo: '603', nome: 'Linha 603', confirmadas: 1 }],
      sequencia_atual: 0,
      melhor_sequencia: 0,
    })
    render(<Selos />)

    const caminho = within(await screen.findByRole('list', { name: 'Selos a caminho' }))
    expect(caminho.getByText('Fiscal da linha 603')).toBeInTheDocument()
    expect(caminho.getByRole('progressbar', { name: 'Progresso de Fiscal da linha 603' })).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByText('Colabore hoje para começar uma sequência.')).toBeInTheDocument()
  })

  it('mostra erro quando não consegue carregar', async () => {
    responder(null, { message: 'falhou' })
    render(<Selos />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar seus selos.')
  })
})
