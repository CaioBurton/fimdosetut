import { useCallback, useEffect, useRef, useState } from 'react'
import { aoAlterarLinhasDoPerfil } from '../lib/linhasDoPerfil'
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

    // Linhas do perfil do usuário: baixadas uma vez e atualizadas quando ele as edita (ou volta à aba),
    // em vez de uma consulta por denúncia nova. `interesses` é a busca em andamento/concluída.
    let interesses: Promise<Set<string> | null> = Promise.resolve(null)
    function carregarInteresses() {
      interesses = Promise.resolve(
        supabase.from('usuario_linhas').select('linha_id').eq('user_id', userId)
      ).then(
        ({ data, error }) =>
          error ? null : new Set(((data ?? []) as { linha_id: string }[]).map((l) => l.linha_id)),
        () => null
      )
    }
    carregarInteresses()
    const parar = aoAlterarLinhasDoPerfil(carregarInteresses)

    const channel = supabase
      .channel(`alertas-linhas-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'denuncias' },
        (payload) => {
          const nova = payload.new as Denuncia
          // Denúncia de parada não tem linha: ninguém a recebe como alerta de linha.
          const linhaIdNova = nova.linha_id
          if (!linhaIdNova) return

          // Só consulta a autoria (privada: só o dono consegue ler a dele) se a linha é de interesse do usuário.
          // Se a lista de linhas não carregou, cai na consulta individual como antes.
          interesses
            .then(async (conjunto) => {
              const interessa = conjunto
                ? conjunto.has(linhaIdNova)
                : !!(
                    await supabase
                      .from('usuario_linhas')
                      .select('linha_id')
                      .eq('user_id', userId)
                      .eq('linha_id', linhaIdNova)
                      .maybeSingle()
                  ).data
              if (!interessa) return null
              const { data } = await supabase
                .from('denuncia_autores')
                .select('denuncia_id')
                .eq('denuncia_id', nova.id)
                .eq('user_id', userId)
                .maybeSingle()
              return data ? null : true
            })
            .then((avisar) => {
              if (!avisar) return
              const alerta: AlertaLinha = {
                id: nova.id,
                linhaId: linhaIdNova,
                tipo: nova.tipo,
                descricao: nova.descricao,
              }
              setAlertas((atual) =>
                atual.some((a) => a.id === alerta.id) ? atual : [alerta, ...atual]
              )

              const linha = linhasRef.current.find((l) => l.id === linhaIdNova)
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
      parar()
      supabase.removeChannel(channel)
      ativos.forEach(clearTimeout)
      ativos.clear()
    }
  }, [userId, dispensar])

  return { alertas, dispensar }
}
