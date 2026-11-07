import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseMock } from '../test/supabaseMock'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { PainelPage } from './PainelPage'

vi.mock('../lib/supabaseClient', () => ({ supabase: createSupabaseMock() }))
vi.mock('../hooks/useAuth')

const resposta = {
  total: 10,
  pendentes: 4,
  resolvidas: 6,
  porZona: [{ chave: 'leste', total: 10 }],
  porTipo: [{ chave: 'quebrado', total: 10 }],
  topLinhas: [{ linhaId: 'l1', codigo: '063', nome: 'DIRCEU / CENTRO', total: 10 }],
  porDia: [{ dia: '2026-11-01', total: 3 }],
}

describe('PainelPage (público)', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAdmin: false,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)
    vi.mocked(supabase.rpc).mockReset()
    vi.mocked(supabase.rpc).mockReturnValue(Promise.resolve({ data: resposta, error: null }) as never)
  })

  it('mostra o resumo vindo do banco para visitante, sem atalho de admin', async () => {
    render(
      <MemoryRouter>
        <PainelPage />
      </MemoryRouter>
    )

    const resumo = await screen.findByRole('region', { name: 'Resumo' })
    expect(await within(resumo).findByText('de 10 denúncias no período')).toBeInTheDocument()
    expect(within(resumo).getByText('60% resolvidas')).toBeInTheDocument()
    expect(screen.getAllByText('063').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /Gerenciar linhas/ })).not.toBeInTheDocument()
    expect(supabase.rpc).toHaveBeenCalledWith('painel_resumo', { dias: 1, zona_filtro: null })
  })

  it('refaz a consulta ao escolher outro período', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <PainelPage />
      </MemoryRouter>
    )
    await screen.findByText('de 10 denúncias no período')

    await user.click(screen.getByRole('button', { name: '7 dias' }))

    expect(supabase.rpc).toHaveBeenLastCalledWith('painel_resumo', { dias: 7, zona_filtro: null })
  })

  it('avisa quando não consegue carregar', async () => {
    vi.mocked(supabase.rpc).mockReturnValue(
      Promise.resolve({ data: null, error: { message: 'x' } }) as never
    )
    render(
      <MemoryRouter>
        <PainelPage />
      </MemoryRouter>
    )

    const avisos = await screen.findAllByRole('alert')
    expect(avisos.some((a) => a.textContent?.includes('Não foi possível carregar o painel'))).toBe(true)
  })

  it('mostra a linha mais problemática da semana, vinda de uma consulta própria', async () => {
    vi.mocked(supabase.rpc).mockImplementation(((nome: string) =>
      Promise.resolve(
        nome === 'ranking_linhas_semana'
          ? { data: [{ linha_id: 'l1', codigo: '063', nome: 'DIRCEU / CENTRO', zona: 'leste', denuncias: 6, pessoas: 4, confirmacoes: 2, pendentes: 3 }], error: null }
          : { data: resposta, error: null }
      )) as never)
    render(
      <MemoryRouter>
        <PainelPage />
      </MemoryRouter>
    )

    const destaque = await screen.findByRole('region', { name: 'Linha mais problemática da semana' })
    expect(await within(destaque).findByText(/6 denúncias de 4 pessoas/)).toBeInTheDocument()
    expect(supabase.rpc).toHaveBeenCalledWith('ranking_linhas_semana', { p_limite: 3 })
  })
})
