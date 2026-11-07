import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../../test/supabaseMock'
import { supabase } from '../../lib/supabaseClient'
import { FotosOrfasAdmin } from './FotosOrfasAdmin'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

const bucket = () => supabase.storage.from('denuncias-fotos')

describe('FotosOrfasAdmin', () => {
  beforeEach(() => {
    vi.mocked(supabase.rpc).mockReset()
    vi.mocked(bucket().remove).mockClear()
  })

  it('mostra que não há órfãs', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as never)
    render(<FotosOrfasAdmin />)
    expect(await screen.findByText('Nenhuma foto órfã.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpar' })).not.toBeInTheDocument()
  })

  it('só apaga depois da confirmação', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: ['a.webp', 'b.webp'], error: null } as never)
    vi.mocked(bucket().remove).mockResolvedValue({ data: [], error: null } as never)
    const user = userEvent.setup()
    render(<FotosOrfasAdmin />)

    expect(await screen.findByText('2 arquivos órfãos.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Limpar' }))
    expect(bucket().remove).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Apagar de vez' }))
    expect(bucket().remove).toHaveBeenCalledWith(['a.webp', 'b.webp'])
    expect(await screen.findByText('2 arquivos apagados.')).toBeInTheDocument()
  })

  it('avisa quando a remoção falha', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: ['a.webp'], error: null } as never)
    vi.mocked(bucket().remove).mockResolvedValue({ data: null, error: { message: 'x' } } as never)
    const user = userEvent.setup()
    render(<FotosOrfasAdmin />)

    await user.click(await screen.findByRole('button', { name: 'Limpar' }))
    await user.click(screen.getByRole('button', { name: 'Apagar de vez' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível limpar/i)
  })
})
