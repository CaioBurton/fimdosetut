import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PoliticaPrivacidadePage } from './PoliticaPrivacidadePage'
import { TermosPage } from './TermosPage'

// O layout (cabeçalho e barra) usa o login; aqui o que importa é o conteúdo dos documentos.
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isAdmin: false, signOut: vi.fn() }),
}))

function renderizar(pagina: React.ReactElement) {
  return render(<MemoryRouter>{pagina}</MemoryRouter>)
}

describe('Política de Privacidade', () => {
  it('cobre os pontos exigidos pela LGPD', () => {
    renderizar(<PoliticaPrivacidadePage />)

    expect(screen.getByRole('heading', { level: 2, name: 'Política de Privacidade' })).toBeInTheDocument()
    for (const titulo of [
      /Quem é responsável pelos seus dados/,
      /Quais dados coletamos/,
      /O que aparece para outras pessoas/,
      /Para que usamos os dados/,
      /Base legal/,
      /Com quem compartilhamos/,
      /Por quanto tempo guardamos/,
      /Seus direitos/,
      /Crianças e adolescentes/,
    ]) {
      expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument()
    }
  })

  it('cita os serviços que recebem dados e o vínculo com a LGPD', () => {
    renderizar(<PoliticaPrivacidadePage />)

    for (const servico of ['Supabase', 'Vercel', 'OpenStreetMap']) {
      expect(screen.getAllByText(new RegExp(servico)).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByText(/Lei nº 13\.709\/2018/).length).toBeGreaterThan(0)
  })

  it('avisa que as denúncias são públicas e o autor não aparece', () => {
    renderizar(<PoliticaPrivacidadePage />)

    expect(screen.getByText(/As denúncias são públicas\./)).toBeInTheDocument()
    expect(screen.getByText(/Seu nome, seu e-mail e o seu perfil não aparecem/)).toBeInTheDocument()
  })

  it('leva para os termos de uso', () => {
    renderizar(<PoliticaPrivacidadePage />)

    expect(screen.getByRole('link', { name: 'Ler também os Termos de Uso' })).toHaveAttribute(
      'href',
      '/termos'
    )
  })
})

describe('Termos de Uso', () => {
  it('traz as regras de uso, a moderação e o foro', () => {
    renderizar(<TermosPage />)

    expect(screen.getByRole('heading', { level: 2, name: 'Termos de Uso' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Regras para enviar denúncias e mensagens/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Moderação/ })).toBeInTheDocument()
    expect(screen.getByText(/foro da comarca de Teresina/)).toBeInTheDocument()
  })

  it('leva para a política de privacidade', () => {
    renderizar(<TermosPage />)

    expect(screen.getByRole('link', { name: 'Ler também a Política de Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade'
    )
  })
})
