import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { LinksLegais } from '../components/legal/LinksLegais'
import { Instagram } from '../components/ui/Instagram'
import { VERSAO_DOCUMENTOS } from '../lib/legal'
import { useAuth } from '../hooks/useAuth'
import { useDesktop } from '../hooks/useDesktop'

export function CadastroPage() {
  const { signUp } = useAuth()
  const desktop = useDesktop()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aceitou, setAceitou] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (!aceitou) {
      setErro('Aceite a Política de Privacidade e os Termos de Uso para criar a conta.')
      return
    }
    setEnviando(true)
    setErro(null)
    // O aceite fica registrado na conta, com a versão dos documentos e o momento do aceite.
    const { error } = await signUp(email, senha, {
      nome: nome.trim(),
      aceite_documentos: VERSAO_DOCUMENTOS,
      aceite_em: new Date().toISOString(),
    })
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

  const conteudo = (
    <>
      {sucesso ? (
        <p className={`card-brand p-4 text-sm text-brand-green-dark ${desktop ? "bg-white" : "!border-brand-cream bg-brand-cream"}`}>
          Conta criada! Verifique seu e-mail se for solicitada confirmação. Redirecionando para o
          login...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className={`card-brand space-y-3 p-5 ${desktop ? "bg-white !shadow-[5px_5px_0_#084400]" : "!border-brand-cream bg-brand-cream !shadow-[5px_5px_0_#052d00]"}`}>
          <input
            required
            type="text"
            autoComplete="name"
            maxLength={80}
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input-brand"
          />
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
          <label className="flex cursor-pointer items-start gap-3 text-sm font-medium leading-snug text-brand-green-dark">
            <input
              type="checkbox"
              checked={aceitou}
              onChange={(e) => {
                setAceitou(e.target.checked)
                setErro(null)
              }}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#084400]"
            />
            <span>
              Li e concordo com a Política de Privacidade e os Termos de Uso, e autorizo o uso dos meus
              dados como descrito nela.
            </span>
          </label>
          <LinksLegais novaAba className="!justify-start" />
          {erro && <p className="text-sm text-zona-leste">{erro}</p>}
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>
      )}

    </>
  )

  const rodape = (
    <>
        <p className="text-center text-sm font-medium">
          Já tem conta?{' '}
          <Link to="/login" className="font-bold underline">
            Entrar
          </Link>
        </p>
    </>
  )

  if (desktop) {
    return (
      <div className="flex h-full">
        <section className="relative flex flex-1 flex-col justify-between gap-8 overflow-hidden bg-brand-green p-12 text-brand-cream">
          <img
            src="/brand/revolta.svg"
            alt=""
            aria-hidden="true"
            className="tom-sobre-tom pointer-events-none absolute -bottom-8 -left-16 w-[760px] max-w-none"
          />
          <Link to="/" className="relative self-start">
            <img
              src="/brand/logo-horizontal-claro.svg"
              alt="Fórum Piauiense de Luta pelo Transporte Público"
              className="block h-[76px] w-auto"
            />
          </Link>
          <div className="relative max-w-md">
            <h1 className="ttl mb-4 text-7xl">Criar conta</h1>
            <p className="text-xl font-bold leading-snug">
              Cadastre-se para poder registrar denúncias e acompanhar as suas linhas.
            </p>
          </div>
        </section>
        <section className="flex flex-1 items-center justify-center overflow-y-auto bg-brand-cream p-12 text-brand-green-dark">
          <div className="flex w-full max-w-md flex-col gap-5">
            {conteudo}
            {rodape}
            <Instagram className="self-center" />
          </div>
        </section>
      </div>
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
          <h1 className="ttl mb-2 text-5xl">Criar conta</h1>
          <p className="max-w-[290px] text-base font-medium leading-snug">
            Cadastre-se para poder registrar denúncias.
          </p>
        </div>
      {sucesso ? (
        <p className={`card-brand p-4 text-sm text-brand-green-dark ${desktop ? "bg-white" : "!border-brand-cream bg-brand-cream"}`}>
          Conta criada! Verifique seu e-mail se for solicitada confirmação. Redirecionando para o
          login...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className={`card-brand space-y-3 p-5 ${desktop ? "bg-white !shadow-[5px_5px_0_#084400]" : "!border-brand-cream bg-brand-cream !shadow-[5px_5px_0_#052d00]"}`}>
          <input
            required
            type="text"
            autoComplete="name"
            maxLength={80}
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input-brand"
          />
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
          <label className="flex cursor-pointer items-start gap-3 text-sm font-medium leading-snug text-brand-green-dark">
            <input
              type="checkbox"
              checked={aceitou}
              onChange={(e) => {
                setAceitou(e.target.checked)
                setErro(null)
              }}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#084400]"
            />
            <span>
              Li e concordo com a Política de Privacidade e os Termos de Uso, e autorizo o uso dos meus
              dados como descrito nela.
            </span>
          </label>
          <LinksLegais novaAba className="!justify-start" />
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
        <Instagram variante="claro" className="self-center" />
      </div>
    </div>
  )
}
