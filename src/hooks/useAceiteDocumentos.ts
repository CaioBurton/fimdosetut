import { useCallback, useEffect, useState } from 'react'
import { VERSAO_DOCUMENTOS } from '../lib/legal'
import { supabase } from '../lib/supabaseClient'

type Estado = 'carregando' | 'pendente' | 'aceito'

/**
 * Confere se quem está logado já aceitou a versão atual da Política de Privacidade e dos Termos
 * de Uso (registro na tabela `aceites_documentos`) e permite registrar o aceite.
 *
 * Se a consulta falhar (sem rede, ou migration ainda não rodada), o app NÃO bloqueia ninguém:
 * é melhor deixar usar do que trancar todas as contas por um erro técnico.
 */
export function useAceiteDocumentos(userId: string | undefined) {
  const [estado, setEstado] = useState<{ userId?: string; valor: Estado }>({ valor: 'carregando' })
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!userId) return
    let active = true

    supabase
      .from('aceites_documentos')
      .select('versao')
      .eq('user_id', userId)
      .eq('versao', VERSAO_DOCUMENTOS)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        setEstado({ userId, valor: error || data ? 'aceito' : 'pendente' })
      })

    return () => {
      active = false
    }
  }, [userId])

  const aceitar = useCallback(async () => {
    if (!userId) return
    setSalvando(true)
    setErro(null)
    const { error } = await supabase
      .from('aceites_documentos')
      .upsert({ user_id: userId, versao: VERSAO_DOCUMENTOS }, { onConflict: 'user_id,versao', ignoreDuplicates: true })
    setSalvando(false)
    if (error) {
      setErro('Não foi possível registrar o seu aceite. Tente novamente.')
      return
    }
    setEstado({ userId, valor: 'aceito' })
  }, [userId])

  // Só vale o resultado da consulta feita para o usuário atual (evita piscar ao trocar de conta).
  const precisaAceitar = !!userId && estado.userId === userId && estado.valor === 'pendente'

  return { precisaAceitar, aceitar, salvando, erro }
}
