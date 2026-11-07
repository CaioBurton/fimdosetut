import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../../test/supabaseMock'
import type { Denuncia } from '../../types'
import { DenunciaCard } from './DenunciaCard'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

function criarDenuncia(sobrescrever: Partial<Denuncia> = {}): Denuncia {
  return {
    id: 'd1',
    linha_id: 'l1',
    tipo: 'quebrado',
    status: 'pendente',
    descricao: 'Ônibus parado na pista.',
    latitude: -5.09,
    longitude: -42.8,
    created_at: '2026-01-10T12:00:00.000Z',
    updated_at: '2026-01-10T12:00:00.000Z',
    linha: { id: 'l1', codigo: '103', nome: 'MOCAMBINHO-ALTO ALEGRE', zona: 'norte' },
    ...sobrescrever,
  }
}

describe('DenunciaCard', () => {
  it('só baixa a foto quando a pessoa pede', async () => {
    const user = userEvent.setup()
    render(<DenunciaCard denuncia={criarDenuncia({ foto_path: 'abc.webp' })} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ver foto da denúncia' }))
    expect(screen.getByAltText('Foto enviada com a denúncia')).toHaveAttribute(
      'src',
      expect.stringContaining('/denuncias-fotos/abc.webp')
    )
  })

  it('avisa o autor quando a foto ainda está em análise', () => {
    render(<DenunciaCard denuncia={criarDenuncia()} fotoEmAnalise />)
    expect(screen.getByText(/foto em análise/i)).toBeInTheDocument()
  })

  it('não mostra o botão de foto em denúncia sem foto', () => {
    render(<DenunciaCard denuncia={criarDenuncia()} />)
    expect(screen.queryByRole('button', { name: 'Ver foto da denúncia' })).not.toBeInTheDocument()
  })

  it('mostra o código, nome da linha, zona, tipo, status e descrição', () => {
    render(<DenunciaCard denuncia={criarDenuncia()} />)

    expect(screen.getByText('103 - MOCAMBINHO-ALTO ALEGRE')).toBeInTheDocument()
    expect(screen.getByText('Norte')).toBeInTheDocument()
    expect(screen.getByText('Ônibus quebrado')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.getByText('Ônibus parado na pista.')).toBeInTheDocument()
  })

  it('mostra "Resolvido" quando o status é resolvido', () => {
    render(<DenunciaCard denuncia={criarDenuncia({ status: 'resolvido' })} />)

    expect(screen.getByText('Resolvido')).toBeInTheDocument()
    expect(screen.queryByText('Pendente')).not.toBeInTheDocument()
  })

  it('cai em "Linha removida" e zona "Outras" quando a linha associada não existe mais', () => {
    render(<DenunciaCard denuncia={criarDenuncia({ linha: undefined })} />)

    expect(screen.getByText('Linha removida')).toBeInTheDocument()
    expect(screen.getByText('Outras')).toBeInTheDocument()
  })

  it('renderiza as ações passadas via prop', () => {
    render(<DenunciaCard denuncia={criarDenuncia()} actions={<button>Excluir</button>} />)

    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
  })
})
