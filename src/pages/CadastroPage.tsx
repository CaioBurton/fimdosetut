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
    setTimeout(() => navigate('/login'), 2000)
  }

  return (
    <div className="flex h-full flex-col justify-center bg-brand-cream px-6">
      <h1 className="font-display mb-1 text-3xl font-black text-brand-green">Criar conta</h1>
      <p className="mb-6 text-sm text-brand-green-dark/70">
        Cadastre-se para poder registrar denúncias.
      </p>

      {sucesso ? (
        <p className="rounded-xl bg-brand-green/10 p-4 text-sm text-brand-green-dark">
          Conta criada! Verifique seu e-mail se for solicitada confirmação. Redirecionando para o
          login...
        </p>
      ) : (
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
            minLength={6}
            type="password"
            placeholder="Senha (mínimo 6 caracteres)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-xl border border-brand-green/30 bg-white px-3 py-3 text-base"
          />
          {erro && <p className="text-sm text-zona-leste">{erro}</p>}
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-brand-green-dark/70">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-brand-green underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
