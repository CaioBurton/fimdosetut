import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

interface RespostaAlternar {
  confirmado: boolean
  total: number
}

/**
 * "Também vi": guarda quais denúncias a pessoa já confirmou (mesmo sem conta, via sessão anônima) e alterna a confirmação.
 * `aoAlterar` recebe o novo total da denúncia, para a lista atualizar o número na hora.
 * Quem confirmou é privado (RLS): a pessoa só lê as próprias confirmações.
 */
export function useConfirmacoes(aoAlterar?: (denunciaId: string, total: number) => void) {
  const { user, signInAnonimo } = useAuth()
  const userId = user?.id ?? null
  const [confirmadas, setConfirmadas] = useState<Set<string>>(new Set())
  const [pendentes, setPendentes] = useState<Set<string>>(new Set())
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    supabase
      .from('denuncia_confirmacoes')
      .select('denuncia_id')
      .then(({ data }) => {
        if (active && data) {
          setConfirmadas(new Set((data as { denuncia_id: string }[]).map((c) => c.denuncia_id)))
        }
      })
    return () => {
      active = false
    }
  }, [userId])

  const alternar = useCallback(
    async (denunciaId: string) => {
      setErro(null)
      setPendentes((atual) => new Set(atual).add(denunciaId))

      // Sem conta: abre uma sessão anônima só para registrar a confirmação (dá para criar a conta depois).
      if (!userId) {
        const { error: erroAnonimo } = await signInAnonimo()
        if (erroAnonimo) {
          setPendentes((atual) => {
            const proximo = new Set(atual)
            proximo.delete(denunciaId)
            return proximo
          })
          setErro('Não foi possível registrar agora. Verifique sua conexão ou entre com uma conta.')
          return
        }
      }

      const { data, error } = await supabase.rpc('alternar_confirmacao', {
        p_denuncia_id: denunciaId,
      })
      setPendentes((atual) => {
        const proximo = new Set(atual)
        proximo.delete(denunciaId)
        return proximo
      })

      const resposta = (Array.isArray(data) ? data[0] : data) as RespostaAlternar | null
      if (error || !resposta) {
        setErro(
          error?.message.includes('limite de confirmações')
            ? 'Você confirmou muitas denúncias em pouco tempo. Crie uma conta ou tente mais tarde.'
            : error?.message.includes('própria denúncia')
            ? 'Você não pode confirmar a sua própria denúncia.'
            : error?.message.includes('já resolvida')
              ? 'Esta denúncia já foi resolvida.'
              : 'Não foi possível registrar. Tente novamente.'
        )
        return
      }

      setConfirmadas((atual) => {
        const proximo = new Set(atual)
        if (resposta.confirmado) proximo.add(denunciaId)
        else proximo.delete(denunciaId)
        return proximo
      })
      aoAlterar?.(denunciaId, resposta.total)
    },
    [aoAlterar, userId, signInAnonimo]
  )

  // Sem login não há confirmações (evita zerar o estado dentro do efeito ao sair da conta).
  return { confirmadas: userId ? confirmadas : new Set<string>(), pendentes, erro, alternar }
}
