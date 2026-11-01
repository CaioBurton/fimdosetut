import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../test/supabaseMock'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { MinhasDenunciasPage } from './MinhasDenunciasPage'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))
vi.mock('../hooks/useAuth')

const linhasFalsas = [{ id: 'l1', codigo: '103', nome: 'MOCAMBINHO', zona: 'norte' }]

function denunciaDoUsuario(sobrescrever: Record<string, unknown> = {}) {
  return {
    id: 'd1',
    user_id: 'u1',
    linha_id: 'l1',
    tipo: 'quebrado',
    status: 'pendente',
    descricao: 'Ônibus parado.',
    latitude: -5.09,
    longitude: -42.8,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    linha: linhasFalsas[0],
    ...sobrescrever,
  }
}

function mockarUsuarioLogado() {
  vi.mocked(useAuth).mockReturnValue({
    // @ts-expect-error -- apenas os campos usados pelo componente são necessários no teste
    user: { id: 'u1', email: 'a@b.com', created_at: '2026-01-01T00:00:00.000Z' },
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })
}

type Resultado = Parameters<typeof createChainable>[0]

// Responde por tabela (a ordem das chamadas não importa); a última chamada em
// `denuncias` após a listagem é a ação (update/delete) da própria tela.
function mockarTabelas(tabelas: {
  linhas?: Resultado
  denuncias?: Resultado
  acao?: Resultado
  perfis_detalhes?: Resultado
  usuario_linhas?: Resultado
}) {
  let chamadasDenuncias = 0
  const vazio = { data: [], error: null }
  vi.mocked(supabase.from).mockImplementation(((tabela: string) => {
    if (tabela === 'linhas') return createChainable(tabelas.linhas ?? vazio)
    if (tabela === 'denuncias') {
      chamadasDenuncias += 1
      return createChainable(chamadasDenuncias === 1 ? (tabelas.denuncias ?? vazio) : (tabelas.acao ?? vazio))
    }
    if (tabela === 'perfis_detalhes') return createChainable(tabelas.perfis_detalhes ?? { data: null, error: null })
    return createChainable(tabelas.usuario_linhas ?? vazio)
  }) as never)
}

function renderPagina() {
  return render(
    <MemoryRouter>
      <MinhasDenunciasPage />
    </MemoryRouter>
  )
}

describe('MinhasDenunciasPage (integração: UI + hooks + Supabase)', () => {
  beforeEach(() => {
    mockarUsuarioLogado()
    vi.mocked(supabase.from).mockReset()
  })

  it('mostra apenas as denúncias do usuário logado', async () => {
    mockarTabelas({
      linhas: { data: linhasFalsas, error: null },
      denuncias: {
        data: [denunciaDoUsuario(), denunciaDoUsuario({ id: 'd2', user_id: 'outro-usuario' })],
        error: null,
      },
    })

    renderPagina()

    expect(await screen.findByText('103 - MOCAMBINHO')).toBeInTheDocument()
    expect(screen.getAllByText('103 - MOCAMBINHO')).toHaveLength(1)
  })

  it('mostra estado vazio quando o usuário não tem denúncias', async () => {
    mockarTabelas({ linhas: { data: linhasFalsas, error: null } })

    renderPagina()

    expect(await screen.findByText('Você ainda não enviou nenhuma denúncia.')).toBeInTheDocument()
  })

  it('marca uma denúncia pendente como resolvida', async () => {
    mockarTabelas({
      linhas: { data: linhasFalsas, error: null },
      denuncias: { data: [denunciaDoUsuario()], error: null },
      acao: { error: null },
    })

    const user = userEvent.setup()
    renderPagina()

    await screen.findByText('103 - MOCAMBINHO')
    await user.click(screen.getByRole('button', { name: 'Marcar resolvido' }))

    const chainDaAcao = vi
      .mocked(supabase.from)
      .mock.results.filter((_, i) => vi.mocked(supabase.from).mock.calls[i][0] === 'denuncias')[1].value
    expect(chainDaAcao.update).toHaveBeenCalledWith({ status: 'resolvido' })
    expect(chainDaAcao.eq).toHaveBeenCalledWith('id', 'd1')
  })

  it('mostra uma mensagem de erro quando a exclusão falha', async () => {
    mockarTabelas({
      linhas: { data: linhasFalsas, error: null },
      denuncias: { data: [denunciaDoUsuario()], error: null },
      acao: { error: { message: 'falhou' } },
    })

    const user = userEvent.setup()
    renderPagina()

    await screen.findByText('103 - MOCAMBINHO')
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(
      await screen.findByText('Não foi possível excluir a denúncia. Tente novamente.')
    ).toBeInTheDocument()
  })

  it('mostra os dados do usuário e as linhas cadastradas no perfil', async () => {
    mockarTabelas({
      linhas: { data: linhasFalsas, error: null },
      perfis_detalhes: {
        data: { bairro_moradia: 'Mocambinho', local_trabalho: 'Centro', local_estudo: 'UFPI' },
        error: null,
      },
      usuario_linhas: { data: [{ linha_id: 'l1' }], error: null },
    })

    renderPagina()

    expect(await screen.findByDisplayValue('Mocambinho')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Centro')).toBeInTheDocument()
    expect(screen.getByDisplayValue('UFPI')).toBeInTheDocument()
    expect(screen.getByText('a@b.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover linha 103' })).toBeInTheDocument()
  })

  it('salva bairro, trabalho e estudo do usuário', async () => {
    mockarTabelas({ linhas: { data: linhasFalsas, error: null } })

    const user = userEvent.setup()
    renderPagina()

    await user.type(await screen.findByLabelText('Bairro onde mora'), 'Santa Maria')
    await user.click(screen.getByRole('button', { name: 'Salvar dados' }))

    expect(await screen.findByText('Dados salvos.')).toBeInTheDocument()
    const chain = vi
      .mocked(supabase.from)
      .mock.results.find((_, i) => vi.mocked(supabase.from).mock.calls[i][0] === 'perfis_detalhes' && (vi.mocked(supabase.from).mock.results[i].value as { upsert: { mock: { calls: unknown[] } } }).upsert.mock.calls.length > 0)
    expect(chain).toBeDefined()
  })

  it('adiciona uma linha ao perfil', async () => {
    mockarTabelas({ linhas: { data: linhasFalsas, error: null } })

    const user = userEvent.setup()
    renderPagina()

    await screen.findByText('Nenhuma linha cadastrada.')
    await user.click(screen.getByRole('combobox', { name: 'Linha' }))
    await user.click(screen.getByRole('option', { name: /103/ }))
    await user.click(screen.getByRole('button', { name: 'Adicionar linha' }))

    expect(await screen.findByRole('button', { name: 'Remover linha 103' })).toBeInTheDocument()
  })
})
