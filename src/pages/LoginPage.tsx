import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const destino = (location.state as { from?: Location })?.from?.pathname ?? '/'

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

  return (
    <div className="flex h-full flex-col justify-center bg-brand-cream px-6">
      <h1 className="font-display mb-1 text-3xl font-black text-brand-green">Entrar</h1>
      <p className="mb-6 text-sm text-brand-green-dark/70">
        Entre para registrar denúncias de ônibus quebrado.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-brand-green/30 bg-white px-3 py-3 text-base"
        />
        <input
          required
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full rounded-xl border border-brand-green/30 bg-white px-3 py-3 text-base"
        />
        {erro && <p className="text-sm text-zona-leste">{erro}</p>}
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-brand-green-dark/70">
        Não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-brand-green underline">
          Cadastre-se
        </Link>
      </p>
      <Link to="/" className="mt-6 block text-center text-xs text-brand-green-dark/50 underline">
        Voltar para o mapa sem entrar
      </Link>
    </div>
  )
}
