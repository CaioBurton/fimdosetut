import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../../test/supabaseMock'
import { useAuth } from '../../hooks/useAuth'
import { VERSAO_DOCUMENTOS } from '../../lib/legal'
import { supabase } from '../../lib/supabaseClient'
import type { Linha } from '../../types'
import { DenunciaForm } from './DenunciaForm'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))
vi.mock('../../hooks/useAuth')

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  useMapEvents: () => null,
}))

const linhas: Linha[] = [{ id: 'l1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte' }]
const signInAnonimo = vi.fn()

function mockarSessao(sessao: { logado: boolean; anonima?: boolean }) {
  vi.mocked(useAuth).mockReturnValue({
    // @ts-expect-error -- apenas os campos usados pelo componente são necessários no teste
    user: sessao.logado ? { id: 'u1' } : null,
    session: null,
    loading: false,
    isAdmin: false,
    isAnonymous: !!sessao.anonima,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInAnonimo,
    vincularConta: vi.fn(),
    signOut: vi.fn(),
  })
}

function mockarGeolocalizacao() {
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn((sucesso: (pos: GeolocationPosition) => void) =>
        sucesso({ coords: { latitude: -5.09, longitude: -42.8 } } as GeolocationPosition)
      ),
    },
  })
}

async function preencher(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: 'Linha' }))
  await user.click(screen.getByRole('option', { name: /103.*MOCAMBINHO/ }))
  await user.type(screen.getByPlaceholderText('Descreva o que está acontecendo...'), 'Parado.')
  await user.click(screen.getByRole('button', { name: /usar minha localização atual/i }))
}

function renderizar(onSuccess = vi.fn()) {
  render(
    <MemoryRouter>
      <DenunciaForm linhas={linhas} onSuccess={onSuccess} />
    </MemoryRouter>
  )
  return onSuccess
}

describe('DenunciaForm sem cadastro', () => {
  beforeEach(() => {
    signInAnonimo.mockReset().mockResolvedValue({ error: null })
    mockarGeolocalizacao()
    vi.mocked(supabase.rpc).mockReset()
    vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data: 'd1', error: null }) as never)
  })

  it('exige o aceite da política antes de enviar sem conta', async () => {
    mockarSessao({ logado: false })
    const user = userEvent.setup()
    renderizar()

    await preencher(user)
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    expect(screen.getByRole('alert')).toHaveTextContent(/Aceite a Política de Privacidade/)
    expect(signInAnonimo).not.toHaveBeenCalled()
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('abre sessão anônima com o aceite, envia a denúncia e avisa que veio sem conta', async () => {
    mockarSessao({ logado: false })
    const user = userEvent.setup()
    const onSuccess = renderizar()

    await preencher(user)
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ semConta: true }))
    expect(signInAnonimo).toHaveBeenCalledWith(
      expect.objectContaining({ aceite_documentos: VERSAO_DOCUMENTOS })
    )
    expect(supabase.rpc).toHaveBeenCalledWith('criar_denuncia', expect.objectContaining({ p_linha_id: 'l1' }))
  })

  it('não envia a denúncia se a sessão anônima falhar', async () => {
    mockarSessao({ logado: false })
    signInAnonimo.mockResolvedValue({ error: 'Anonymous sign-ins are disabled' })
    const user = userEvent.setup()
    const onSuccess = renderizar()

    await preencher(user)
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível enviar agora/)
    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('mostra o aviso de limite quando o servidor recusa por excesso de denúncias', async () => {
    mockarSessao({ logado: true, anonima: true })
    vi.mocked(supabase.rpc).mockReturnValue(
      Promise.resolve({ data: null, error: { message: 'limite de denúncias por hora atingido' } }) as never
    )
    const user = userEvent.setup()
    renderizar()

    await preencher(user)
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/muitas denúncias em pouco tempo/)
  })

  it('não pede aceite nem abre sessão anônima de novo para quem já tem sessão sem cadastro', async () => {
    mockarSessao({ logado: true, anonima: true })
    const user = userEvent.setup()
    const onSuccess = renderizar()

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    await preencher(user)
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ semConta: true }))
    expect(signInAnonimo).not.toHaveBeenCalled()
  })

  it('quem tem conta envia direto, sem convite para criar conta', async () => {
    mockarSessao({ logado: true })
    const user = userEvent.setup()
    const onSuccess = renderizar()

    await preencher(user)
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ semConta: false }))
  })
})
