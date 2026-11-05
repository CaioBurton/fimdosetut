import { useLayoutEffect, useRef, useState } from 'react'

interface TextoExpansivelProps {
  texto: string
  className?: string
  /** Linhas visíveis antes do "Ver mais". */
  linhas?: number
}

/** Mostra só as primeiras linhas do texto; se ele for maior que isso, aparece "Ver mais" / "Ver menos". */
export function TextoExpansivel({ texto, className = '', linhas = 4 }: TextoExpansivelProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [aberto, setAberto] = useState(false)
  const [temMais, setTemMais] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || aberto) return
    const medir = () => setTemMais(el.scrollHeight > el.clientHeight + 1)
    medir()
    if (typeof ResizeObserver === 'undefined') return
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [texto, linhas, aberto])

  return (
    <div>
      <p
        ref={ref}
        className={`whitespace-pre-line break-words ${className}`}
        style={aberto ? undefined : { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: linhas, overflow: 'hidden' }}
      >
        {texto}
      </p>
      {(temMais || aberto) && (
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="mt-1 text-xs font-bold underline underline-offset-2"
        >
          {aberto ? 'Ver menos' : 'Ver mais'}
        </button>
      )}
    </div>
  )
}
