import { useEffect, useState } from 'react'
import { limparFotosOrfas, listarFotosOrfas } from '../../lib/fotosDenuncias'
import { Button } from '../ui/Button'

/**
 * Arquivos do bucket que nenhuma denúncia usa mais (restos de exclusões que falharam). A lista vem
 * do banco; a remoção é feita pela API do Storage.
 */
export function FotosOrfasAdmin() {
  const [total, setTotal] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    let active = true
    listarFotosOrfas().then(({ paths, error }) => {
      if (!active) return
      if (error) setErro('Não foi possível verificar as fotos órfãs.')
      else setTotal(paths.length)
    })
    return () => {
      active = false
    }
  }, [])

  async function limpar() {
    setErro(null)
    setAviso(null)
    setOcupado(true)
    const { apagadas, error } = await limparFotosOrfas()
    setConfirmando(false)
    if (error) {
      setOcupado(false)
      setErro('Não foi possível limpar as fotos órfãs. Tente novamente.')
      return
    }
    // Confere de novo no banco o que sobrou, em vez de supor que tudo foi apagado.
    const { paths } = await listarFotosOrfas()
    setOcupado(false)
    setTotal(paths.length)
    setAviso(`${apagadas} ${apagadas === 1 ? 'arquivo apagado' : 'arquivos apagados'}.`)
  }

  return (
    <section className="card-brand space-y-2 p-3.5">
      <h3 className="text-sm font-bold">Fotos órfãs</h3>
      <p className="text-xs text-brand-green-dark/70">
        Arquivos com mais de 1 dia que nenhuma denúncia usa. Ocupam espaço do Storage sem aparecer em lugar nenhum.
      </p>
      {erro && <p role="alert" className="text-sm text-zona-leste">{erro}</p>}
      {aviso && <p role="status" className="text-sm font-semibold">{aviso}</p>}
      {total !== null && !aviso && (
        <p className="text-sm">
          {total === 0 ? 'Nenhuma foto órfã.' : `${total} ${total === 1 ? 'arquivo órfão' : 'arquivos órfãos'}.`}
        </p>
      )}
      {total !== null && total > 0 &&
        (confirmando ? (
          <div className="flex gap-2">
            <Button variant="ghost" className="w-auto flex-1 py-2 text-sm text-zona-leste" disabled={ocupado} onClick={limpar}>
              Apagar de vez
            </Button>
            <Button variant="secondary" className="w-auto flex-1 py-2 text-sm" disabled={ocupado} onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="secondary" className="w-auto py-2 text-sm" onClick={() => setConfirmando(true)}>
            Limpar
          </Button>
        ))}
    </section>
  )
}
