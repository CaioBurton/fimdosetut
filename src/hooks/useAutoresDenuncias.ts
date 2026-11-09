import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Só para o admin: quem fez cada denúncia (nome, senão e-mail; "Anônimo" para quem denunciou sem
 * cadastro, que não tem perfil). Consulta só as denúncias pedidas. Para os demais não faz nada.
 */
export function useAutoresDenuncias(ids: string[], ativo: boolean) {
  const [autores, setAutores] = useState<Map<string, string>>(new Map())
  const chave = useMemo(() => [...ids].sort().join(','), [ids])

  useEffect(() => {
    if (!ativo || !chave) return
    let vivo = true
    const lista = chave.split(',')

    async function carregar() {
      const { data: vinculos, error } = await supabase
        .from('denuncia_autores')
        .select('denuncia_id, user_id')
        .in('denuncia_id', lista)
      if (!vivo || error || !vinculos) return
      const usuarios = [...new Set(vinculos.map((v) => v.user_id as string))]
      const [{ data: perfis }, { data: nomes }] = await Promise.all([
        supabase.from('profiles').select('id, email').in('id', usuarios),
        supabase.rpc('nomes_por_usuario', { ids: usuarios }),
      ])
      if (!vivo) return
      const emailDe = new Map((perfis ?? []).map((p) => [p.id as string, p.email as string]))
      const nomeDe = new Map(((nomes ?? []) as { user_id: string; nome: string }[]).map((n) => [n.user_id, n.nome]))
      const mapa = new Map<string, string>()
      for (const v of vinculos) {
        const id = v.user_id as string
        // Sem perfil = login anônimo (denúncia sem cadastro).
        mapa.set(v.denuncia_id as string, nomeDe.get(id) || emailDe.get(id) || 'Anônimo')
      }
      setAutores((antes) => new Map([...antes, ...mapa]))
    }
    carregar()

    return () => {
      vivo = false
    }
  }, [chave, ativo])

  return autores
}
