import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export function CadastroPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setEnviando(true)
    setErro(null)
    const { error } = await signUp(email, senha)
    setEnviando(false)
    if (error) {
      setErro(
        error.toLowerCase().includes('fetch')
          ? 'Não foi possível criar a conta agora. Verifique sua conexão e tente novamente.'
          : error
      )
      return
    }
    setSucesso(true)
    setTimeout(() => navigate('/login'), 8000)
  }

  return (
    <div className="relative flex h-full flex-col justify-center gap-6 overflow-hidden bg-brand-green px-6 text-brand-cream">
      <img
        src="/brand/revolta.svg"
        alt=""
        aria-hidden="true"
        className="tom-sobre-tom pointer-events-none absolute -bottom-5 -left-14 w-[520px] max-w-none"
      />
      <div className="relative flex flex-col gap-6">
        <Link to="/" className="self-start">
          <img
            src="/brand/logo-horizontal-claro.svg"
            alt="Fórum Piauiense de Luta pelo Transporte Público"
            className="block h-16 w-auto"
          />
        </Link>
        <div>
          <h1 className="ttl mb-2 text-5xl">Criar conta</h1>
          <p className="max-w-[290px] text-base font-medium leading-snug">
            Cadastre-se para poder registrar denúncias.
          </p>
        </div>
      {sucesso ? (
        <p className="card-brand !border-brand-cream bg-brand-cream p-4 text-sm text-brand-green-dark">
          Conta criada! Verifique seu e-mail se for solicitada confirmação. Redirecionando para o
          login...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="card-brand !border-brand-cream !shadow-[5px_5px_0_#052d00] space-y-3 bg-brand-cream p-5">
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
            minLength={6}
            type="password"
            placeholder="Senha (mínimo 6 caracteres)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="input-brand"
          />
          {erro && <p className="text-sm text-zona-leste">{erro}</p>}
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>
      )}

        <p className="text-center text-sm font-medium">
          Já tem conta?{' '}
          <Link to="/login" className="font-bold underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
