import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Entrar e Criar conta no desktop: identidade do Fórum à esquerda, formulário à direita. */
export function TelaDividida({ texto, children }: { texto: string; children: ReactNode }) {
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
        <div className="relative max-w-[460px]">
          <p className="ttl mb-4 text-7xl leading-[0.88]">Deu o Prego!</p>
          <p className="text-xl font-bold leading-snug">{texto}</p>
        </div>
      </section>
      <section className="flex flex-1 items-center justify-center overflow-y-auto bg-brand-cream p-12 text-brand-green-dark">
        <div className="flex w-full max-w-[440px] flex-col gap-5">{children}</div>
      </section>
    </div>
  )
}
