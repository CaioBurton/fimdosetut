import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DATA_DOCUMENTOS } from '../../lib/legal'
import { TituloSecao } from '../ui/TituloSecao'

export interface SecaoLegal {
  titulo: string
  conteudo: ReactNode
}

interface DocumentoLegalProps {
  titulo: string
  introducao: ReactNode
  secoes: SecaoLegal[]
  /** Link para o outro documento, mostrado no fim. */
  outro: { rotulo: string; para: string }
}

export function DocumentoLegal({ titulo, introducao, secoes, outro }: DocumentoLegalProps) {
  return (
    <article className="space-y-6 p-4">
      <header className="space-y-2">
        <h2 className="ttl text-3xl">{titulo}</h2>
        <p className="text-xs font-bold text-brand-green-dark/70">Última atualização: {DATA_DOCUMENTOS}</p>
        <div className="text-sm leading-relaxed text-brand-green-dark/90">{introducao}</div>
      </header>

      {secoes.map((secao, i) => (
        <section key={secao.titulo} aria-labelledby={`secao-legal-${i}`}>
          <TituloSecao id={`secao-legal-${i}`}>
            {i + 1}. {secao.titulo}
          </TituloSecao>
          <div className="space-y-2.5 text-sm leading-relaxed [&_a]:font-bold [&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-1.5">
            {secao.conteudo}
          </div>
        </section>
      ))}

      <p className="border-t-2 border-brand-green pt-4 text-center text-sm font-bold">
        <Link to={outro.para} className="underline">
          {outro.rotulo}
        </Link>
      </p>
    </article>
  )
}
