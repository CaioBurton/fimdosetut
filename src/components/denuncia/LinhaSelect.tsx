import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ZONA_COLORS, ZONA_LABELS, type Linha, type Zona } from '../../types'

const ORDEM_ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'outras']

interface LinhaSelectProps {
  linhas: Linha[]
  value: string
  onChange: (linhaId: string) => void
}

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function LinhaSelect({ linhas, value, onChange }: LinhaSelectProps) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const raiz = useRef<HTMLDivElement>(null)
  const listaId = useId()

  const selecionada = linhas.find((l) => l.id === value)

  const grupos = useMemo(() => {
    const termo = normalizar(busca.trim())
    return ORDEM_ZONAS.map((zona) => ({
      zona,
      linhas: linhas.filter(
        (l) => l.zona === zona && (!termo || normalizar(`${l.codigo} ${l.nome}`).includes(termo))
      ),
    })).filter((g) => g.linhas.length > 0)
  }, [linhas, busca])

  useEffect(() => {
    if (!aberto) return
    function fora(e: MouseEvent | TouchEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fora)
    document.addEventListener('touchstart', fora)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('touchstart', fora)
    }
  }, [aberto])

  function escolher(id: string) {
    onChange(id)
    setAberto(false)
    setBusca('')
  }

  return (
    <div
      ref={raiz}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setAberto(false)
      }}
    >
      <button
        type="button"
        role="combobox"
        aria-label="Linha"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listaId}
        onClick={() => setAberto((a) => !a)}
        className="input-brand flex items-center justify-between gap-2 text-left"
      >
        {selecionada ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="ttl shrink-0 bg-brand-green px-2 py-1 text-sm leading-none text-brand-cream">
              {selecionada.codigo}
            </span>
            <span className="truncate font-semibold">{selecionada.nome}</span>
          </span>
        ) : (
          <span className="text-brand-green-dark/60">Selecione a linha do ônibus</span>
        )}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div className="card-brand absolute inset-x-0 top-full z-[1000] mt-2 flex max-h-80 flex-col overflow-hidden !bg-brand-cream">
          <div className="border-b-2 border-brand-green p-2">
            <input
              autoFocus
              type="search"
              aria-label="Buscar linha"
              placeholder="Buscar por número ou nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const primeira = grupos[0]?.linhas[0]
                  if (primeira) escolher(primeira.id)
                }
              }}
              className="input-brand !min-h-11 !text-sm"
            />
          </div>
          <div id={listaId} role="listbox" aria-label="Linhas" className="overflow-y-auto">
            {grupos.length === 0 && (
              <p className="p-4 text-center text-sm text-brand-green-dark/70">
                Nenhuma linha encontrada.
              </p>
            )}
            {grupos.map((grupo) => (
              <div key={grupo.zona} role="group" aria-label={`Zona ${ZONA_LABELS[grupo.zona]}`}>
                <div className="ttl sticky top-0 flex items-center gap-2 bg-brand-green px-3 py-1.5 text-xs text-brand-cream">
                  <i
                    className="block h-2.5 w-2.5 rounded-full border border-brand-cream"
                    style={{ backgroundColor: ZONA_COLORS[grupo.zona] }}
                  />
                  Zona {ZONA_LABELS[grupo.zona]}
                </div>
                {grupo.linhas.map((linha) => {
                  const ativa = linha.id === value
                  return (
                    <button
                      key={linha.id}
                      type="button"
                      role="option"
                      aria-selected={ativa}
                      onClick={() => escolher(linha.id)}
                      className={`flex min-h-11 w-full items-center gap-3 border-b border-brand-green/15 px-3 py-2 text-left text-sm ${
                        ativa
                          ? 'bg-brand-green/10 font-bold'
                          : 'active:bg-brand-green/10 hover:bg-brand-green/5'
                      }`}
                    >
                      <span className="ttl w-12 shrink-0 text-base text-brand-green">
                        {linha.codigo}
                      </span>
                      <span className="min-w-0 flex-1">{linha.nome}</span>
                      {ativa && (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M5 12l5 5 9-10" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
