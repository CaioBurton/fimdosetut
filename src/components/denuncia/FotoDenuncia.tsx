import { useState } from 'react'
import { urlFoto } from '../../lib/fotosDenuncias'

/**
 * Foto da denúncia, baixada só quando a pessoa pede ("Ver foto"): a lista e o mapa mostram muitas
 * denúncias e carregar todas as imagens gastaria o tráfego de saída do plano gratuito do Supabase.
 */
export function FotoDenuncia({ path, className = '' }: { path: string; className?: string }) {
  const [aberta, setAberta] = useState(false)
  const [falhou, setFalhou] = useState(false)
  const url = urlFoto(path)

  if (!aberta) {
    return (
      <button
        type="button"
        onClick={() => setAberta(true)}
        className={`chip-brand ${className}`}
        aria-label="Ver foto da denúncia"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="6" width="18" height="14" rx="1" />
          <circle cx="12" cy="13" r="3.5" />
          <path d="M8 6l1.5-2h5L16 6" />
        </svg>
        Ver foto
      </button>
    )
  }

  if (falhou) {
    return <p className={`text-xs font-semibold text-brand-green-dark/70 ${className}`}>A foto não está mais disponível.</p>
  }

  return (
    <div className={className}>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block" aria-label="Abrir a foto em tamanho maior">
        <img
          src={url}
          alt="Foto enviada com a denúncia"
          loading="lazy"
          decoding="async"
          onError={() => setFalhou(true)}
          className="max-h-72 w-full rounded-[2px] border-2 border-brand-green bg-brand-green/5 object-contain"
        />
      </a>
      <button
        type="button"
        onClick={() => setAberta(false)}
        className="mt-1.5 text-xs font-bold text-brand-green-dark/80 underline"
      >
        Esconder foto
      </button>
    </div>
  )
}
