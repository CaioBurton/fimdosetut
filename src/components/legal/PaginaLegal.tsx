import { Link } from 'react-router-dom'
import { useDesktop } from '../../hooks/useDesktop'
import { AppLayout } from '../layout/AppLayout'
import { DocumentoLegal, type DocumentoLegalProps } from './DocumentoLegal'

/** Política e Termos: no celular dentro do app; no desktop, página própria com índice lateral. */
export function PaginaLegal({ tituloLayout, ...documento }: DocumentoLegalProps & { tituloLayout: string }) {
  const desktop = useDesktop()

  if (!desktop) {
    return (
      <AppLayout title={tituloLayout}>
        <DocumentoLegal {...documento} />
      </AppLayout>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-brand-cream">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-brand-green px-8 py-4 text-brand-cream">
        <Link to="/" aria-label="Fórum Piauiense de Luta pelo Transporte Público">
          <img
            src="/brand/logo-horizontal-claro.svg"
            alt="Fórum Piauiense de Luta pelo Transporte Público"
            className="block h-[52px] w-auto max-w-none"
          />
        </Link>
        <Link to="/" className="text-[15px] font-bold underline">
          ← Voltar ao app
        </Link>
      </header>
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-start gap-10 px-8 py-10">
        <nav aria-label="Neste documento" className="sticky top-6 w-60 shrink-0">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.08em] text-[#2f5a28]">Neste documento</p>
          {documento.secoes.map((secao, i) => (
            <a
              key={secao.titulo}
              href={`#secao-legal-${i}`}
              className="block border-l-[3px] border-transparent px-3 py-2.5 text-sm font-semibold hover:border-brand-green hover:bg-[#e3f2da]"
            >
              {i + 1}. {secao.titulo}
            </a>
          ))}
        </nav>
        <div className="min-w-0 max-w-[720px] flex-[999_1_480px]">
          <DocumentoLegal {...documento} />
        </div>
      </div>
    </div>
  )
}
