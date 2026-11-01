import { useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

/**
 * Convite para criar a conta depois da primeira denúncia sem cadastro. Usa o mesmo acesso da
 * denúncia já enviada (o id da pessoa não muda), então as denúncias continuam dela.
 * O aceite da Política e dos Termos já foi dado antes de enviar.
 */
export function VincularConta({ onConcluido }: { onConcluido?: () => void }) {
  const { vincularConta } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setEnviando(true)
    setErro(null)
    const { error } = await vincularConta(email.trim(), senha, nome.trim())
    setEnviando(false)
    if (error) {
      setErro(
        error.toLowerCase().includes('fetch')
          ? 'Não foi possível criar a conta agora. Verifique sua conexão e tente novamente.'
          : error
      )
      return
    }
    setPronto(true)
    onConcluido?.()
  }

  if (pronto) {
    return (
      <p role="status" className="card-brand !bg-white p-4 text-sm font-semibold text-brand-green-dark">
        Quase lá! Se pedirmos, confirme o seu e-mail pela mensagem que enviamos. Suas denúncias já
        estão ligadas à conta.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card-brand space-y-3 !bg-white p-4">
      <div>
        <h2 className="ttl text-xl text-brand-green">Guarde suas denúncias</h2>
        <p className="mt-1 text-sm leading-snug text-brand-green-dark">
          Crie uma conta para acompanhar o que você reportou e não perder nada se trocar de celular
          ou limpar o navegador.
        </p>
      </div>
      <input
        required
        type="text"
        autoComplete="name"
        maxLength={80}
        placeholder="Nome"
        aria-label="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="input-brand"
      />
      <input
        required
        type="email"
        autoComplete="email"
        placeholder="E-mail"
        aria-label="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-brand"
      />
      <input
        required
        minLength={6}
        type="password"
        autoComplete="new-password"
        placeholder="Senha (mínimo 6 caracteres)"
        aria-label="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        className="input-brand"
      />
      {erro && (
        <p role="alert" className="text-sm font-semibold text-zona-leste">
          {erro}
        </p>
      )}
      <Button type="submit" disabled={enviando}>
        {enviando ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  )
}
