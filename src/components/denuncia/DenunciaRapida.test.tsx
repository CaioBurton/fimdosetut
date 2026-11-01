import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../../test/supabaseMock'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import type { Linha } from '../../types'
import { DenunciaRapida } from './DenunciaRapida'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))
vi.mock('../../hooks/useAuth')

const linhas: Linha[] = [
  { id: 'l1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte' },
  { id: 'l2', codigo: '200', nome: 'CENTRO', zona: 'sul' },
]

function mockarUsuario(logado = true) {
  vi.mocked(useAuth).mockReturnValue({
    // @ts-expect-error -- apenas os campos usados pelo componente são necessários no teste
    user: logado ? { id: 'u1' } : null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })
}

function mockarFavoritas(ids: string[]) {
  vi.mocked(supabase.from).mockImplementation(((tabela: string) =>
    createChainable({
      data: tabela === 'usuario_linhas' ? ids.map((linha_id) => ({ linha_id })) : null,
      error: null,
    })) as never)
}

function mockarGeolocalizacao(ok: boolean) {
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn(
        (sucesso: (p: GeolocationPosition) => void, falha: () => void) =>
          ok
            ? sucesso({ coords: { latitude: -5.09, longitude: -42.8 } } as GeolocationPosition)
            : falha()
      ),
    },
  })
}

function renderizar() {
  return render(
    <MemoryRouter>
      <DenunciaRapida linhas={linhas} />
    </MemoryRouter>
  )
}

describe('DenunciaRapida', () => {
  beforeEach(() => {
    mockarUsuario()
    mockarFavoritas(['l1'])
    mockarGeolocalizacao(true)
    vi.mocked(supabase.rpc).mockReset()
    vi.mocked(supabase.rpc).mockReturnValue(createChainable({ data: 'novo', error: null }) as never)
  })

  it('convida a denunciar sem conta quando não há login', () => {
    mockarUsuario(false)
    renderizar()

    expect(screen.getByRole('link', { name: /denuncie agora/i })).toHaveAttribute('href', '/nova')
  })

  it('mostra só as linhas favoritas', async () => {
    renderizar()

    expect(await screen.findByRole('button', { name: '103' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '200' })).not.toBeInTheDocument()
  })

  it('convida a adicionar linhas no perfil quando não há favoritas', async () => {
    mockarFavoritas([])
    renderizar()

    expect(await screen.findByRole('link', { name: /adicione as linhas/i })).toHaveAttribute(
      'href',
      '/minhas'
    )
  })

  it('envia a denúncia em 3 toques, com o GPS automático', async () => {
    const user = userEvent.setup()
    renderizar()

    await user.click(await screen.findByRole('button', { name: '103' })) // 1
    await user.click(screen.getByRole('button', { name: 'Ônibus quebrado' })) // 2
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' })) // 3

    expect(supabase.rpc).toHaveBeenCalledWith('criar_denuncia', {
      p_linha_id: 'l1',
      p_tipo: 'quebrado',
      p_descricao: 'Denúncia rápida: ônibus quebrado.',
      p_numero_veiculo: null,
      p_latitude: -5.09,
      p_longitude: -42.8,
    })
    expect(await screen.findByText(/Denúncia enviada/)).toBeInTheDocument()
  })

  it('só habilita o envio depois de escolher o problema', async () => {
    const user = userEvent.setup()
    renderizar()

    await user.click(await screen.findByRole('button', { name: '103' }))

    expect(screen.getByRole('button', { name: 'Enviar denúncia' })).toBeDisabled()
  })

  it('oferece o formulário completo quando o GPS falha', async () => {
    mockarGeolocalizacao(false)
    const user = userEvent.setup()
    renderizar()

    await user.click(await screen.findByRole('button', { name: '103' }))
    await user.click(screen.getByRole('button', { name: 'Atraso' }))

    expect(screen.getByRole('link', { name: 'marcar no mapa' })).toHaveAttribute('href', '/nova')
    expect(screen.getByRole('button', { name: 'Enviar denúncia' })).toBeDisabled()
  })

  it('mostra erro e mantém a seleção quando o envio falha', async () => {
    vi.mocked(supabase.rpc).mockReturnValue(
      createChainable({ data: null, error: { message: 'falhou' } }) as never
    )
    const user = userEvent.setup()
    renderizar()

    await user.click(await screen.findByRole('button', { name: '103' }))
    await user.click(screen.getByRole('button', { name: 'Atraso' }))
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Não foi possível enviar/))
    expect(screen.getByRole('button', { name: 'Atraso' })).toHaveAttribute('aria-pressed', 'true')
  })
})
