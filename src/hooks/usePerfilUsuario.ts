import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { PerfilDetalhes } from '../types'

const DETALHES_VAZIOS: PerfilDetalhes = {
  bairro_moradia: '',
  local_trabalho: '',
  local_estudo: '',
}

const ERRO_CARREGAR = 'Não foi possível carregar seu perfil. Verifique sua conexão.'

export function usePerfilUsuario(userId: string | undefined) {
  const [detalhes, setDetalhes] = useState<PerfilDetalhes>(DETALHES_VAZIOS)
  const [linhaIds, setLinhaIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true

    Promise.all([
      supabase.from('perfis_detalhes').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('usuario_linhas').select('linha_id').eq('user_id', userId),
    ]).then(
      ([det, lin]) => {
        if (!active) return
        if (det.error || lin.error) {
          setError(ERRO_CARREGAR)
        } else {
          const d = det.data as Partial<PerfilDetalhes> | null
          setDetalhes({
            bairro_moradia: d?.bairro_moradia ?? '',
            local_trabalho: d?.local_trabalho ?? '',
            local_estudo: d?.local_estudo ?? '',
          })
          setLinhaIds(((lin.data ?? []) as { linha_id: string }[]).map((l) => l.linha_id))
        }
        setLoading(false)
      },
      () => {
        if (!active) return
        setError(ERRO_CARREGAR)
        setLoading(false)
      }
    )

    return () => {
      active = false
    }
  }, [userId])

  const salvarDetalhes = useCallback(
    async (novos: PerfilDetalhes) => {
      if (!userId) return 'Você precisa estar logado.'
      const { error } = await supabase
        .from('perfis_detalhes')
        .upsert({ user_id: userId, ...novos, updated_at: new Date().toISOString() })
      if (error) return 'Não foi possível salvar seus dados. Tente novamente.'
      setDetalhes(novos)
      return null
    },
    [userId]
  )

  const adicionarLinha = useCallback(
    async (linhaId: string) => {
      if (!userId) return 'Você precisa estar logado.'
      const { error } = await supabase
        .from('usuario_linhas')
        .insert({ user_id: userId, linha_id: linhaId })
      if (error) return 'Não foi possível adicionar a linha. Tente novamente.'
      setLinhaIds((atual) => (atual.includes(linhaId) ? atual : [...atual, linhaId]))
      return null
    },
    [userId]
  )

  const removerLinha = useCallback(
    async (linhaId: string) => {
      if (!userId) return 'Você precisa estar logado.'
      const { error } = await supabase
        .from('usuario_linhas')
        .delete()
        .eq('user_id', userId)
        .eq('linha_id', linhaId)
      if (error) return 'Não foi possível remover a linha. Tente novamente.'
      setLinhaIds((atual) => atual.filter((id) => id !== linhaId))
      return null
    },
    [userId]
  )

  return { detalhes, linhaIds, loading, error, salvarDetalhes, adicionarLinha, removerLinha }
}
