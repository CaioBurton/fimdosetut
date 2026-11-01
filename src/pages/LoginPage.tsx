import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { TelaDividida } from '../components/layout/TelaDividida'
import { LinksLegais } from '../components/legal/LinksLegais'
import { Instagram } from '../components/ui/Instagram'
import { useAuth } from '../hooks/useAuth'
import { useDesktop } from '../hooks/useDesktop'
import { lerAvisoLogin, limparAvisoLogin } from '../lib/avisoLogin'

export function LoginPage() {
  const { signIn } = useAuth()
  const desktop = useDesktop()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const destino = (location.state as { from?: Location } | null)?.from?.pathname ?? '/'
  // Recado de outra tela (ex.: conta excluída): lido ao abrir e apagado em seguida.
  const [aviso] = useState(lerAvisoLogin)
  useEffect(() => limparAvisoLogin(), [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const { error } = await signIn(email, senha)
    setEnviando(false)
    if (error) {
      setErro(
        error.toLowerCase().includes('invalid login credentials')
          ? 'E-mail ou senha inválidos.'
          : 'Não foi possível entrar agora. Verifique sua conexão e tente novamente.'
      )
      return
    }
    navigate(destino, { replace: true })
  }

  const formulario = (
      <form onSubmit={handleSubmit} className={`card-brand space-y-3 p-5 ${desktop ? "bg-white !shadow-[5px_5px_0_#084400]" : "!border-brand-cream bg-brand-cream !shadow-[5px_5px_0_#052d00]"}`}>
        <input
          required
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-brand"
        />
        <input
          required
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="input-brand"
        />
        {erro && <p className="text-sm text-zona-leste">{erro}</p>}
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
  )

  if (desktop) {
    return (
      <TelaDividida texto="Ônibus quebrado, atrasado ou lotado? Registre, veja no mapa e cobre o transporte público de Teresina.">
        <div>
          <h1 className="ttl text-[44px] leading-[0.9]">Entrar</h1>
          <p className="mt-2 text-[15px] font-medium text-[#2f5a28]">
            Entre para registrar denúncias e acompanhar suas linhas.
          </p>
        </div>
        {aviso && (
          <p role="status" className="rounded-[2px] border-2 border-brand-green px-3.5 py-3 text-sm font-bold">
            {aviso}
          </p>
        )}
        {formulario}
        <p className="text-center text-sm font-semibold">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-bold underline">
            Cadastre-se
          </Link>
        </p>
        <LinksLegais />
      </TelaDividida>
    )
  }

  return (
    <div className="relative flex h-full flex-col justify-center gap-6 overflow-hidden bg-brand-green px-6 text-brand-cream">
      <img
        src="/brand/revolta.svg"
        alt=""
        aria-hidden="true"
        className="tom-sobre-tom pointer-events-none absolute -bottom-5 -left-14 w-[520px] max-w-none"
      />
      <div className="relative flex flex-col gap-6 lg:mx-auto lg:w-full lg:max-w-md">
        <Link to="/" className="self-start">
          <img
            src="/brand/logo-horizontal-claro.svg"
            alt="Fórum Piauiense de Luta pelo Transporte Público"
            className="block h-16 w-auto"
          />
        </Link>
        <div>
          <h1 className="ttl mb-2 text-5xl">Entrar</h1>
          <p className="max-w-[290px] text-base font-medium leading-snug">
            Entre para registrar denúncias de ônibus quebrado.
          </p>
        </div>
        {aviso && (
          <p role="status" className="rounded-[2px] border-2 border-brand-cream px-3.5 py-3 text-sm font-bold">
            {aviso}
          </p>
        )}
      {formulario}
        <p className="text-center text-sm font-medium">
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-bold underline">
            Cadastre-se
          </Link>
        </p>
        <Link to="/" className="block text-center text-sm font-bold underline">
          Voltar para o mapa sem entrar
        </Link>
        <Instagram variante="claro" className="self-center" />
        <LinksLegais variante="claro" />
      </div>
    </div>
  )
}
