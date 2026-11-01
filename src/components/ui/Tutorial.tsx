import { useState } from 'react'

export const TUTORIAL_KEY = 'deu-o-prego:tutorial-visto'

const PASSOS = [
  {
    titulo: 'Bem-vindo ao Deu o Prego!',
    texto:
      'Aqui a gente avisa quando o ônibus quebra, atrasa ou vem lotado nas linhas de Teresina. Veja como usar em 4 passos.',
    imagem: '/brand/onibus-bandeira.svg',
  },
  {
    titulo: 'Veja o mapa',
    texto:
      'Cada explosão é uma denúncia, com o número da linha. A cor mostra a zona. Toque numa explosão para ler os detalhes e use os filtros no topo.',
    imagem: '/brand/explosao-contorno.svg',
  },
  {
    titulo: 'Reporte um problema',
    texto:
      'Toque em "Reportar", escolha a linha, o tipo de problema e marque o local no mapa. É preciso estar logado para enviar.',
    imagem: '/brand/explosao-cheia.svg',
  },
  {
    titulo: 'Acompanhe tudo',
    texto:
      'Na aba "Lista" você vê todas as denúncias e filtra por zona. Em "Minhas" você marca as suas como resolvidas ou exclui.',
    imagem: '/brand/revolta.svg',
  },
]

function jaViu() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1'
  } catch {
    return false
  }
}

function marcarComoVisto() {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1')
  } catch {
    // sem localStorage: o tutorial reaparece na próxima visita
  }
}

export function Tutorial() {
  const [aberto, setAberto] = useState(() => !jaViu())
  const [passo, setPasso] = useState(0)

  if (!aberto) return null

  const ultimo = passo === PASSOS.length - 1
  const atual = PASSOS[passo]

  function fechar() {
    marcarComoVisto()
    setAberto(false)
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-brand-green-dark/80 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-titulo"
        className="card-brand flex w-full max-w-sm flex-col overflow-hidden !bg-brand-cream"
      >
        <div className="relative flex h-32 items-center justify-center overflow-hidden bg-brand-green">
          <img
            src={atual.imagem}
            alt=""
            aria-hidden="true"
            className="tom-sobre-tom h-28 w-auto max-w-none object-contain"
          />
          <span className="ttl absolute left-3 top-3 text-xs text-brand-cream">
            {passo + 1}/{PASSOS.length}
          </span>
        </div>

        <div className="flex flex-col gap-2 p-5">
          <h2 id="tutorial-titulo" className="ttl text-2xl text-brand-green">
            {atual.titulo}
          </h2>
          <p className="text-base leading-snug text-brand-green-dark">{atual.texto}</p>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={fechar}
            className="min-h-11 text-sm font-bold text-brand-green underline"
          >
            Pular
          </button>
          <div className="flex gap-2">
            {passo > 0 && (
              <button
                type="button"
                onClick={() => setPasso(passo - 1)}
                className="ttl min-h-11 rounded-[2px] border-2 border-brand-green px-4 text-sm text-brand-green"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={() => (ultimo ? fechar() : setPasso(passo + 1))}
              className="ttl min-h-11 rounded-[2px] border-2 border-brand-green bg-brand-green px-4 text-sm text-brand-cream"
            >
              {ultimo ? 'Começar' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
