import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../../test/supabaseMock'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import type { Linha } from '../../types'
import { enviarFoto, removerFotos } from '../../lib/fotosDenuncias'
import { DenunciaForm } from './DenunciaForm'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))
vi.mock('../../hooks/useAuth')
vi.mock('../../lib/fotosDenuncias', async (original) => ({
  ...(await original<typeof import('../../lib/fotosDenuncias')>()),
  enviarFoto: vi.fn(),
  removerFotos: vi.fn().mockResolvedValue({ error: null }),
}))

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  useMapEvents: () => null,
  useMap: () => ({ setView: () => undefined, getZoom: () => 15 }),
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
  await user.click(screen.getByRole('combobox', { name: 'Linha' }))
  await user.click(screen.getByRole('option', { name: /103.*MOCAMBINHO/ }))
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
    vi.mocked(supabase.rpc).mockReset()
  })

  it('impede o envio sem selecionar uma linha', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<DenunciaForm linhas={linhas} onSuccess={onSuccess} />)

    await user.type(
      screen.getByPlaceholderText('Descreva o que está acontecendo...'),
      'Ônibus parado.'
    )
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    expect(screen.getByText('Selecione a linha.')).toBeInTheDocument()
    expect(supabase.from).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('impede o envio sem marcar a localização, mesmo com os campos obrigatórios preenchidos', async () => {
    // Permissão negada: a localização automática falha e o local continua sem marcação.
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((_ok: unknown, erro: (e: unknown) => void) => erro({ code: 1 })),
      },
    })
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<DenunciaForm linhas={linhas} onSuccess={onSuccess} />)

    await user.click(screen.getByRole('combobox', { name: 'Linha' }))
  await user.click(screen.getByRole('option', { name: /103.*MOCAMBINHO/ }))
    await user.type(
      screen.getByPlaceholderText('Descreva o que está acontecendo...'),
      'Ônibus parado.'
    )
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    expect(screen.getByText('Marque a localização no mapa.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Sem o local, a denúncia não aparece no mapa.')
    expect(supabase.from).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('envia a denúncia com o payload correto e chama onSuccess', async () => {
    vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data: 'd1', error: null }) as never)
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<DenunciaForm linhas={linhas} onSuccess={onSuccess} />)

    await preencherELocalizar(user)
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    // A denúncia é criada por uma função do banco; quem envia vem da sessão, não do app.
    expect(supabase.rpc).toHaveBeenCalledWith('criar_denuncia', {
      p_linha_id: 'l1',
      p_tipo: 'quebrado',
      p_descricao: 'Ônibus parado.',
      p_numero_veiculo: null,
      p_latitude: -5.09,
      p_longitude: -42.8,
      p_foto_path: null,
      p_local_tipo: 'onibus',
      p_referencia_parada: null,
    })
    expect(supabase.from).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalled()
  })

  it('denuncia uma parada sem linha: manda o ponto do mapa e a referência', async () => {
    vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data: 'd2', error: null }) as never)
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(<DenunciaForm linhas={linhas} onSuccess={onSuccess} />)

    await user.click(screen.getByRole('button', { name: 'Parada' }))
    // Sem lista de paradas: não há seletor de linha nem número de veículo.
    expect(screen.queryByRole('combobox', { name: 'Linha' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/número do veículo/i)).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/referência da parada/i), ' Av. Frei Serafim, 1450 ')
    await user.click(screen.getByRole('combobox', { name: 'Tipo de problema' }))
    await user.click(screen.getByRole('option', { name: 'Sem banco' }))
    await user.click(screen.getByRole('button', { name: /usar minha localização atual/i }))
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    expect(supabase.rpc).toHaveBeenCalledWith('criar_denuncia', {
      p_linha_id: null,
      p_tipo: 'parada_sem_banco',
      p_descricao: 'Denúncia: sem banco.',
      p_numero_veiculo: null,
      p_latitude: -5.09,
      p_longitude: -42.8,
      p_foto_path: null,
      p_local_tipo: 'parada',
      p_referencia_parada: 'Av. Frei Serafim, 1450',
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('trocar de Ônibus para Parada volta o tipo para o primeiro da lista de paradas', async () => {
    const user = userEvent.setup()
    render(<DenunciaForm linhas={linhas} onSuccess={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Parada' }))
    expect(screen.getByRole('combobox', { name: 'Tipo de problema' })).toHaveTextContent(
      'Sem abrigo ou cobertura quebrada'
    )
  })

  it('envia o número do veículo quando informado', async () => {
    vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data: 'd1', error: null }) as never)
    const user = userEvent.setup()
    render(<DenunciaForm linhas={linhas} onSuccess={vi.fn()} />)

    await preencherELocalizar(user)
    await user.type(screen.getByLabelText(/número do veículo/i), ' 12345 ')
    await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

    expect(supabase.rpc).toHaveBeenCalledWith(
      'criar_denuncia',
      expect.objectContaining({ p_numero_veiculo: '12345' })
    )
  })

  it('destaca o número do veículo quando o problema é de acessibilidade', async () => {
    const user = userEvent.setup()
    render(<DenunciaForm linhas={linhas} onSuccess={vi.fn()} />)

    expect(screen.getByLabelText(/número do veículo.*\(opcional\)/i)).toBeInTheDocument()
    expect(screen.queryByText('(importante)')).not.toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Tipo de problema' }))
    await user.click(screen.getByRole('option', { name: /acessibilidade/i }))

    expect(screen.getByLabelText(/número do veículo.*\(importante\)/i)).toBeInTheDocument()
    expect(screen.getByText(/provar quais veículos estão sem acessibilidade/i)).toBeInTheDocument()
  })

  it('mostra uma mensagem amigável e não chama onSuccess quando o envio falha', async () => {
    vi.mocked(supabase.rpc).mockReturnValue(
      Promise.resolve({ data: null, error: { message: 'TypeError: Failed to fetch' } }) as never
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

  describe('foto', () => {
    const fotoArquivo = () => new File(['x'], 'onibus.jpg', { type: 'image/jpeg' })

    beforeEach(() => {
      vi.mocked(enviarFoto).mockReset()
      vi.mocked(removerFotos).mockClear()
      URL.createObjectURL = vi.fn(() => 'blob:previa')
      URL.revokeObjectURL = vi.fn()
    })

    it('envia a foto e manda o caminho dela para a denúncia', async () => {
      vi.mocked(enviarFoto).mockResolvedValue({ path: 'abc.webp', error: null })
      vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data: 'd1', error: null }) as never)
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      render(<DenunciaForm linhas={linhas} onSuccess={onSuccess} />)

      await preencherELocalizar(user)
      await user.upload(screen.getByLabelText('Foto da denúncia'), fotoArquivo())
      expect(screen.getByAltText('Prévia da foto escolhida')).toHaveAttribute('src', 'blob:previa')
      await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

      expect(enviarFoto).toHaveBeenCalledTimes(1)
      expect(supabase.rpc).toHaveBeenCalledWith(
        'criar_denuncia',
        expect.objectContaining({ p_foto_path: 'abc.webp' })
      )
      expect(onSuccess).toHaveBeenCalled()
    })

    it('não cria a denúncia quando a foto não sobe', async () => {
      vi.mocked(enviarFoto).mockResolvedValue({
        path: null,
        error: 'Não foi possível enviar a foto. Tente novamente ou envie sem foto.',
      })
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      render(<DenunciaForm linhas={linhas} onSuccess={onSuccess} />)

      await preencherELocalizar(user)
      await user.upload(screen.getByLabelText('Foto da denúncia'), fotoArquivo())
      await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

      expect(await screen.findByText(/não foi possível enviar a foto/i)).toBeInTheDocument()
      expect(supabase.rpc).not.toHaveBeenCalled()
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('apaga a foto enviada quando a denúncia falha', async () => {
      vi.mocked(enviarFoto).mockResolvedValue({ path: 'abc.webp', error: null })
      vi.mocked(supabase.rpc).mockReturnValue(
        Promise.resolve({ data: null, error: { message: 'erro' } }) as never
      )
      const user = userEvent.setup()
      render(<DenunciaForm linhas={linhas} onSuccess={vi.fn()} />)

      await preencherELocalizar(user)
      await user.upload(screen.getByLabelText('Foto da denúncia'), fotoArquivo())
      await user.click(screen.getByRole('button', { name: 'Enviar denúncia' }))

      expect(await screen.findByText(/não foi possível enviar a denúncia/i)).toBeInTheDocument()
      expect(removerFotos).toHaveBeenCalledWith(['abc.webp'])
    })

    it('recusa arquivos que não são imagem e permite remover a foto escolhida', async () => {
      const user = userEvent.setup({ applyAccept: false })
      render(<DenunciaForm linhas={linhas} onSuccess={vi.fn()} />)

      await user.upload(
        screen.getByLabelText('Foto da denúncia'),
        new File(['x'], 'doc.pdf', { type: 'application/pdf' })
      )
      expect(screen.getByText('Escolha um arquivo de imagem (foto).')).toBeInTheDocument()

      await user.upload(screen.getByLabelText('Foto da denúncia'), fotoArquivo())
      expect(screen.getByAltText('Prévia da foto escolhida')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Remover foto' }))
      expect(screen.queryByAltText('Prévia da foto escolhida')).not.toBeInTheDocument()
    })
  })
})
