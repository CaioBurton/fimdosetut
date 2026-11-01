import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Denuncia } from '../../types'
import { DenunciaCard } from './DenunciaCard'

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
