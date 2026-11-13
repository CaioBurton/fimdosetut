import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePainelParadas } from '../../hooks/usePainelParadas'
import { PARADAS_VAZIO } from '../../lib/resumoParadas'
import { PainelParadas } from './PainelParadas'

vi.mock('../../hooks/usePainelParadas', () => ({ usePainelParadas: vi.fn() }))

function mockar(parcial: Partial<ReturnType<typeof usePainelParadas>>) {
  vi.mocked(usePainelParadas).mockReturnValue({
    resumo: PARADAS_VAZIO,
    loading: false,
    error: null,
    ...parcial,
  })
}

describe('PainelParadas', () => {
  beforeEach(() => vi.mocked(usePainelParadas).mockReset())

  it('mostra totais e os problemas mais citados', () => {
    mockar({
      resumo: {
        total: 5,
        pendentes: 3,
        resolvidas: 2,
        porTipo: [
          { chave: 'parada_sem_abrigo', total: 4 },
          { chave: 'parada_sujeira', total: 1 },
        ],
      },
    })
    render(<PainelParadas periodo="todos" />)

    expect(screen.getByRole('heading', { name: 'Paradas' })).toBeInTheDocument()
    expect(screen.getByText('Pendentes').nextElementSibling).toHaveTextContent('3')
    const lista = screen.getByRole('region', { name: 'Problemas mais citados nas paradas' })
    expect(within(lista).getByText('Sem abrigo ou cobertura quebrada')).toBeInTheDocument()
    expect(within(lista).getByRole('img', { name: 'Sem abrigo ou cobertura quebrada: 4 denúncias' })).toBeInTheDocument()
    expect(within(lista).getByRole('img', { name: 'Sujeira ou lixo: 1 denúncia' })).toBeInTheDocument()
  })

  it('explica quando ainda não há denúncias de parada', () => {
    mockar({})
    render(<PainelParadas periodo="7d" />)

    expect(screen.getByText(/Ainda não há denúncias de parada/)).toBeInTheDocument()
    expect(screen.queryByText('Problemas mais citados')).not.toBeInTheDocument()
  })

  it('mostra o erro de carregamento', () => {
    mockar({ error: 'Não foi possível carregar as paradas.' })
    render(<PainelParadas periodo="todos" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar as paradas.')
  })

  it('pede o resumo do período escolhido', () => {
    mockar({})
    render(<PainelParadas periodo="30d" />)

    expect(usePainelParadas).toHaveBeenCalledWith('30d')
  })
})
