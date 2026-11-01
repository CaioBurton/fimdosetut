import { render, screen, within } from '@testing-library/react'
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

function mockarUsuarioLogado(userMetadata: Record<string, unknown> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    // @ts-expect-error -- apenas os campos usados pelo componente são necessários no teste
    user: {
      id: 'u1',
      email: 'a@b.com',
      created_at: '2026-01-01T00:00:00.000Z',
      user_metadata: userMetadata,
    },
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })
}

type Resultado = Parameters<typeof createChainable>[0]

// Responde por tabela (a ordem das chamadas não importa): a listagem vem da visão
// `minhas_denuncias` e as ações (update/delete) da própria tela vão em `denuncias`.
function mockarTabelas(tabelas: {
  linhas?: Resultado
  denuncias?: Resultado
  acao?: Resultado
  perfis_detalhes?: Resultado
  usuario_linhas?: Resultado
}) {
  const vazio = { data: [], error: null }
  vi.mocked(supabase.from).mockImplementation(((tabela: string) => {
    if (tabela === 'linhas') return createChainable(tabelas.linhas ?? vazio)
    if (tabela === 'minhas_denuncias') return createChainable(tabelas.denuncias ?? vazio)
    if (tabela === 'denuncias') return createChainable(tabelas.acao ?? vazio)
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

  it('mostra as denúncias do usuário logado (visão minhas_denuncias)', async () => {
    mockarTabelas({
      linhas: { data: linhasFalsas, error: null },
      denuncias: {
        data: [denunciaDoUsuario()],
        error: null,
      },
    })

    renderPagina()

    expect(await screen.findByText('103 - MOCAMBINHO')).toBeInTheDocument()
    expect(screen.getAllByText('103 - MOCAMBINHO')).toHaveLength(1)
    // As denúncias do usuário vêm da visão do banco, sem filtrar por autor no navegador.
    expect(supabase.from).toHaveBeenCalledWith('minhas_denuncias')
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
      .mock.results.filter((_, i) => vi.mocked(supabase.from).mock.calls[i][0] === 'denuncias')[0].value
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

  it('mostra no resumo do perfil o total de denúncias, resolvidas e linhas do usuário', async () => {
    mockarTabelas({
      linhas: { data: linhasFalsas, error: null },
      denuncias: {
        data: [denunciaDoUsuario(), { ...denunciaDoUsuario(), id: 'd2', status: 'resolvido' }],
        error: null,
      },
      usuario_linhas: { data: [{ linha_id: 'l1' }], error: null },
    })

    renderPagina()

    const resumo = await screen.findByRole('region', { name: 'Resumo do perfil' })
    await screen.findByRole('button', { name: 'Remover linha 103' })
    expect(within(resumo).getByText('Denúncias').previousSibling).toHaveTextContent('2')
    expect(within(resumo).getByText('Resolvidas').previousSibling).toHaveTextContent('1')
    expect(within(resumo).getByText('Minhas linhas').previousSibling).toHaveTextContent('1')
  })

  it('pagina as denúncias do usuário, 5 por vez', async () => {
    const muitas = Array.from({ length: 7 }, (_, i) =>
      denunciaDoUsuario({ id: `d${i + 1}`, descricao: `Problema ${i + 1}` })
    )
    mockarTabelas({
      linhas: { data: linhasFalsas, error: null },
      denuncias: { data: muitas, error: null },
    })

    const user = userEvent.setup()
    renderPagina()

    expect(await screen.findByText('Problema 1')).toBeInTheDocument()
    expect(screen.getByText('Problema 5')).toBeInTheDocument()
    expect(screen.queryByText('Problema 6')).not.toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Próxima/ }))

    expect(screen.getByText('Problema 6')).toBeInTheDocument()
    expect(screen.getByText('Problema 7')).toBeInTheDocument()
    expect(screen.queryByText('Problema 1')).not.toBeInTheDocument()
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
  })

  it('não mostra a paginação quando as denúncias cabem numa página', async () => {
    mockarTabelas({
      linhas: { data: linhasFalsas, error: null },
      denuncias: { data: [denunciaDoUsuario()], error: null },
    })

    renderPagina()

    await screen.findByText('Ônibus parado.')
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument()
  })

  it('mostra o nome da pessoa no lugar do e-mail no topo do perfil', async () => {
    mockarTabelas({
      linhas: { data: linhasFalsas, error: null },
      perfis_detalhes: {
        data: { nome: 'Maria Souza', bairro_moradia: '', local_trabalho: '', local_estudo: '' },
        error: null,
      },
    })

    renderPagina()

    const resumo = await screen.findByRole('region', { name: 'Resumo do perfil' })
    expect(await within(resumo).findByRole('heading', { name: 'Maria Souza' })).toBeInTheDocument()
    expect(within(resumo).queryByText('a@b.com')).not.toBeInTheDocument()
    // o e-mail continua visível, mas só nos dados da conta
    expect(screen.getByText('a@b.com')).toBeInTheDocument()
  })

  it('usa o nome informado no cadastro até a pessoa editar', async () => {
    mockarUsuarioLogado({ nome: 'João do Cadastro' })
    mockarTabelas({ linhas: { data: linhasFalsas, error: null } })

    renderPagina()

    expect(await screen.findByRole('heading', { name: 'João do Cadastro' })).toBeInTheDocument()
  })

  it('convida a adicionar o nome quando ainda não há nenhum', async () => {
    mockarTabelas({ linhas: { data: linhasFalsas, error: null } })

    renderPagina()

    expect(await screen.findByRole('heading', { name: 'Adicione seu nome' })).toBeInTheDocument()
  })

  it('edita o nome pelo botão ao lado e salva no perfil', async () => {
    mockarTabelas({
      linhas: { data: linhasFalsas, error: null },
      perfis_detalhes: {
        data: { nome: 'Maria', bairro_moradia: 'Dirceu', local_trabalho: '', local_estudo: '' },
        error: null,
      },
    })
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByRole('button', { name: 'Editar nome' }))
    const campo = screen.getByLabelText('Seu nome')
    expect(campo).toHaveValue('Maria')
    await user.clear(campo)
    await user.type(campo, '  Maria Souza ')
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }))

    expect(await screen.findByRole('heading', { name: 'Maria Souza' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Seu nome')).not.toBeInTheDocument()
    const chain = vi
      .mocked(supabase.from)
      .mock.results.map((r) => r.value as { upsert: { mock: { calls: unknown[][] } } })
      .find((c) => c.upsert?.mock.calls.length > 0)
    expect(chain?.upsert.mock.calls[0][0]).toMatchObject({
      user_id: 'u1',
      nome: 'Maria Souza',
      bairro_moradia: 'Dirceu',
    })
  })

  it('não salva nome vazio e permite cancelar a edição', async () => {
    mockarTabelas({ linhas: { data: linhasFalsas, error: null } })
    const user = userEvent.setup()
    renderPagina()

    await user.click(await screen.findByRole('button', { name: 'Editar nome' }))
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }))
    expect(screen.getByText('Digite o seu nome.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByLabelText('Seu nome')).not.toBeInTheDocument()
  })
})
