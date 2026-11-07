import { useCallback, useEffect, useState } from 'react'
import { aprovarFoto, recusarFoto } from '../lib/fotosDenuncias'
import { supabase } from '../lib/supabaseClient'
import type { TipoProblema } from '../types'

export interface FotoPendente {
  denuncia_id: string
  foto_path: string
  created_at: string
  denuncia: {
    tipo: TipoProblema
    descricao: string
    created_at: string
    linha: { codigo: string; nome: string } | null
  } | null
}

/** Fila de fotos esperando aprovação (só o admin lê a fila toda), da mais antiga para a mais nova. */
export function useFotosPendentes() {
  const [fotos, setFotos] = useState<FotoPendente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase
      .from('fotos_pendentes')
      .select('denuncia_id, foto_path, created_at, denuncia:denuncias(tipo, descricao, created_at, linha:linhas(codigo, nome))')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        if (!active) return
        if (error) setError('Não foi possível carregar as fotos para análise.')
        else setFotos(data as unknown as FotoPendente[])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const tirarDaLista = (id: string) => setFotos((atual) => atual.filter((f) => f.denuncia_id !== id))

  const aprovar = useCallback(async (id: string) => {
    const { error } = await aprovarFoto(id)
    if (error) return 'Não foi possível aprovar a foto. Tente novamente.'
    tirarDaLista(id)
    return null
  }, [])

  const recusar = useCallback(async (id: string) => {
    const { error } = await recusarFoto(id)
    if (error) return 'Não foi possível recusar a foto. Tente novamente.'
    tirarDaLista(id)
    return null
  }, [])

  return { fotos, loading, error, aprovar, recusar }
}
