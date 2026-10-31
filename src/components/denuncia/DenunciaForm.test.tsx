import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../../test/supabaseMock'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import type { Linha } from '../../types'
import { DenunciaForm } from './DenunciaForm'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))
vi.mock('../../hooks/useAuth')

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  useMapEvents: () => null,
}))

const linhas: Linha[] = [{ id: 'l1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte' }]

function mockarUsuarioLogado() {
  vi.mocked(useAuth).mockReturnValue({
    // @ts-expect-error -- apenas os campos usados pelo componente são necessários no teste
    user: { id: 'u1' },
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })
}

function mockarGeolocalizacao(lat = -5.09, lng = -42.8) {
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn((sucesso: (pos: GeolocationPosition) => void) =>
        sucesso({ coords: { latitude: lat, longitude: lng } } as GeolocationPosition)
      ),
    },
  })
}

async function preencherELocalizar(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByRole('combobox', { name: 'Linha' }), '103 - MOCAMBINHO')
  await user.type(
    screen.getByPlaceholderText('Descreva o que está acontecendo...'),
    'Ônibus parado.'
  )
  await user.click(screen.getByRole('button', { name: /usar minha localização atual/i }))
}

describe('DenunciaForm (integração: formulário + LinhaSelect + LocationPicker + Supabase)', () => {
  beforeEach(() => {
    mockarUsuarioLogado()
    mockarGeolocalizacao()
    vi.mocked(supabase.from).mockReset()
  })

  it('impede o envio sem selecionar uma linha, bloqueado pela validação nativa do campo obrigatório', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<DenunciaForm linhas={linhas} onSuccess={onSuccess} />)

    const selectLinha = screen.getByRole('combobox', { name: 'Linha' }) as HTMLSelectElement
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    expect(selectLinha.validity.valid).toBe(false)
    expect(supabase.from).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('impede o envio sem marcar a localização, mesmo com os campos obrigatórios preenchidos', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<DenunciaForm linhas={linhas} onSuccess={onSuccess} />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Linha' }), '103 - MOCAMBINHO')
    await user.type(
      screen.getByPlaceholderText('Descreva o que está acontecendo...'),
      'Ônibus parado.'
    )
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    expect(screen.getByText('Marque a localização no mapa.')).toBeInTheDocument()
    expect(supabase.from).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('envia a denúncia com o payload correto e chama onSuccess', async () => {
    vi.mocked(supabase.from).mockReturnValue(createChainable({ error: null }) as never)
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<DenunciaForm linhas={linhas} onSuccess={onSuccess} />)

    await preencherELocalizar(user)
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    const chain = vi.mocked(supabase.from).mock.results[0].value
    expect(supabase.from).toHaveBeenCalledWith('denuncias')
    expect(chain.insert).toHaveBeenCalledWith({
      user_id: 'u1',
      linha_id: 'l1',
      tipo: 'quebrado',
      descricao: 'Ônibus parado.',
      latitude: -5.09,
      longitude: -42.8,
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('mostra uma mensagem amigável e não chama onSuccess quando o envio falha', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      createChainable({ error: { message: 'TypeError: Failed to fetch' } }) as never
    )
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<DenunciaForm linhas={linhas} onSuccess={onSuccess} />)

    await preencherELocalizar(user)
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    expect(
      await screen.findByText('Não foi possível enviar a denúncia. Verifique sua conexão e tente novamente.')
    ).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
