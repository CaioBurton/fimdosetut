import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../../test/supabaseMock'
import { supabase } from '../../lib/supabaseClient'
import { FotosPendentesAdmin } from './FotosPendentesAdmin'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

const fila = [
  {
    denuncia_id: 'd1',
    foto_path: 'aaa.webp',
    created_at: '2026-11-06T12:00:00.000Z',
    denuncia: { tipo: 'quebrado', descricao: 'Pneu furado', created_at: '2026-11-06T12:00:00.000Z', linha: { codigo: '103', nome: 'MOCAMBINHO' } },
  },
  {
    denuncia_id: 'd2',
    foto_path: 'bbb.webp',
    created_at: '2026-11-06T13:00:00.000Z',
    denuncia: { tipo: 'lotado', descricao: '', created_at: '2026-11-06T13:00:00.000Z', linha: null },
  },
]

describe('FotosPendentesAdmin', () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReturnValue(createChainable({ data: fila }) as never)
    vi.mocked(supabase.rpc).mockReset()
    vi.mocked(supabase.storage.from('denuncias-fotos').remove).mockClear()
  })

  it('lista as fotos da fila com a denúncia', async () => {
    render(<FotosPendentesAdmin />)

    expect(await screen.findByText(/103 - MOCAMBINHO/)).toBeInTheDocument()
    expect(screen.getByText('Pneu furado')).toBeInTheDocument()
    expect(screen.getByAltText('Foto enviada com a denúncia d1')).toHaveAttribute('src', expect.stringContaining('aaa.webp'))
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('aprovar publica a foto e tira da fila', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)
    const user = userEvent.setup()
    render(<FotosPendentesAdmin />)

    const card = (await screen.findByAltText('Foto enviada com a denúncia d1')).closest('article')!
    await user.click(within(card).getByRole('button', { name: 'Aprovar' }))

    expect(supabase.rpc).toHaveBeenCalledWith('aprovar_foto', { p_denuncia_id: 'd1' })
    expect(screen.queryByAltText('Foto enviada com a denúncia d1')).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('recusar apaga o arquivo e tira da fila', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'bbb.webp', error: null } as never)
    const user = userEvent.setup()
    render(<FotosPendentesAdmin />)

    const card = (await screen.findByAltText('Foto enviada com a denúncia d2')).closest('article')!
    await user.click(within(card).getByRole('button', { name: 'Recusar' }))

    expect(supabase.rpc).toHaveBeenCalledWith('recusar_foto', { p_denuncia_id: 'd2' })
    expect(supabase.storage.from('denuncias-fotos').remove).toHaveBeenCalledWith(['bbb.webp'])
    expect(screen.queryByAltText('Foto enviada com a denúncia d2')).not.toBeInTheDocument()
  })

  it('mantém a foto na fila e avisa quando a aprovação falha', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'erro' } } as never)
    const user = userEvent.setup()
    render(<FotosPendentesAdmin />)

    const card = (await screen.findByAltText('Foto enviada com a denúncia d1')).closest('article')!
    await user.click(within(card).getByRole('button', { name: 'Aprovar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível aprovar a foto')
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })
})
