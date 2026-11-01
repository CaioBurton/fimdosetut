import { useCallback, useEffect, useRef, useState } from 'react'
import { notificarNavegador } from '../lib/notificacaoNavegador'
import { supabase } from '../lib/supabaseClient'
import { TIPO_LABELS, type Denuncia, type Linha } from '../types'

export interface AlertaLinha {
  id: string
  linhaId: string
  tipo: Denuncia['tipo']
  descricao: string
}

const DURACAO_MS = 10000

/**
 * Avisa quando alguém reporta um problema numa linha que o usuário cadastrou no perfil.
 * Só funciona com o app aberto (usa o realtime do Supabase).
 */
export function useAlertasLinhas(userId: string | undefined, linhas: Linha[]) {
  const [alertas, setAlertas] = useState<AlertaLinha[]>([])
  const linhasRef = useRef(linhas)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  useEffect(() => {
    linhasRef.current = linhas
  }, [linhas])

  const dispensar = useCallback((id: string) => {
    setAlertas((atual) => atual.filter((a) => a.id !== id))
  }, [])

  useEffect(() => {
    if (!userId) return
    const ativos = timers.current

    const channel = supabase
      .channel(`alertas-linhas-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'denuncias' },
        (payload) => {
          const nova = payload.new as Denuncia

          // Consulta a cada evento para refletir mudanças recentes nas linhas do perfil, e confere
          // se a denúncia é do próprio usuário (a autoria é privada: só o dono consegue ler a dele).
          Promise.all([
            supabase
              .from('usuario_linhas')
              .select('linha_id')
              .eq('user_id', userId)
              .eq('linha_id', nova.linha_id)
              .maybeSingle(),
            supabase
              .from('denuncia_autores')
              .select('denuncia_id')
              .eq('denuncia_id', nova.id)
              .eq('user_id', userId)
              .maybeSingle(),
          ])
            .then(([interesse, minha]) => {
              if (!interesse.data || minha.data) return
              const alerta: AlertaLinha = {
                id: nova.id,
                linhaId: nova.linha_id,
                tipo: nova.tipo,
                descricao: nova.descricao,
              }
              setAlertas((atual) =>
                atual.some((a) => a.id === alerta.id) ? atual : [alerta, ...atual]
              )

              const linha = linhasRef.current.find((l) => l.id === nova.linha_id)
              notificarNavegador(
                `Problema na linha ${linha?.codigo ?? ''}`.trim(),
                `${TIPO_LABELS[nova.tipo]}: ${nova.descricao}`
              )

              const timer = setTimeout(() => {
                ativos.delete(timer)
                dispensar(alerta.id)
              }, DURACAO_MS)
              ativos.add(timer)
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      ativos.forEach(clearTimeout)
      ativos.clear()
    }
  }, [userId, dispensar])

  return { alertas, dispensar }
}
