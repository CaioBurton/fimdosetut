import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../../test/supabaseMock'
import { supabase } from '../../lib/supabaseClient'
import { LinhaDaSemana } from './LinhaDaSemana'

vi.mock('../../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))

function responder(data: unknown, error: { message: string } | null = null) {
  vi.mocked(supabase.rpc).mockReset()
  vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data, error }) as never)
}

const linha = (sobrescrever: Record<string, unknown> = {}) => ({
  linha_id: 'l1',
  codigo: '103',
  nome: 'MOCAMBINHO-ALTO ALEGRE',
  zona: 'norte',
  denuncias: 12,
  pessoas: 8,
  confirmacoes: 20,
  pendentes: 5,
  ...sobrescrever,
})

describe('LinhaDaSemana', () => {
  beforeEach(() => responder([]))

  it('destaca a primeira linha com os totais, sem mostrar quem denunciou', async () => {
    responder([linha()])
    render(<LinhaDaSemana />)

    const secao = await screen.findByRole('region', { name: 'Linha mais problemática da semana' })
    expect(await within(secao).findByText('MOCAMBINHO-ALTO ALEGRE')).toBeInTheDocument()
    expect(within(secao).getByText('103')).toBeInTheDocument()
    expect(within(secao).getByText('Zona Norte')).toBeInTheDocument()
    expect(within(secao).getByText(/12 denúncias de 8 pessoas/)).toBeInTheDocument()
    expect(within(secao).getByText(/5 pendentes/)).toBeInTheDocument()
    expect(within(secao).getByText(/20 confirmações/)).toBeInTheDocument()
    expect(supabase.rpc).toHaveBeenCalledWith('ranking_linhas_semana', { p_limite: 3 })
  })

  it('lista as outras linhas em "Também em alta"', async () => {
    responder([linha(), linha({ linha_id: 'l2', codigo: '200', nome: 'CENTRO', zona: 'sul', denuncias: 5, pessoas: 3 })])
    render(<LinhaDaSemana />)

    const outras = within(await screen.findByRole('list'))
    expect(outras.getByText('CENTRO')).toBeInTheDocument()
    expect(outras.getByText(/5 denúncias · 3 pessoas/)).toBeInTheDocument()
    expect(screen.getByText('Também em alta')).toBeInTheDocument()
  })

  it('usa o singular quando há um só', async () => {
    responder([linha({ denuncias: 1, pessoas: 1, pendentes: 1, confirmacoes: 1 })])
    render(<LinhaDaSemana />)

    expect(await screen.findByText(/1 denúncia de 1 pessoa/)).toBeInTheDocument()
    expect(screen.getByText(/1 pendente/)).toBeInTheDocument()
    expect(screen.getByText(/1 confirmação/)).toBeInTheDocument()
  })

  it('explica a regra quando ainda não há linha em destaque', async () => {
    responder([])
    render(<LinhaDaSemana />)

    expect(await screen.findByText(/pelo menos 2 pessoas diferentes denunciam a mesma linha/)).toBeInTheDocument()
  })

  it('avisa que o ranking é de linhas e não de pessoas', async () => {
    responder([linha()])
    render(<LinhaDaSemana />)

    expect(await screen.findByText(/O ranking é de linhas, não de pessoas/)).toBeInTheDocument()
  })

  it('mostra erro quando não consegue carregar', async () => {
    responder(null, { message: 'falhou' })
    render(<LinhaDaSemana />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o ranking.')
  })
})
