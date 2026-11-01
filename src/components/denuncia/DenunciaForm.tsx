import { useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import type { Linha, TipoProblema } from '../../types'
import { Button } from '../ui/Button'
import { LocationPicker } from '../map/LocationPicker'
import { LinhaSelect } from './LinhaSelect'
import { TipoSelect } from './TipoSelect'

export function DenunciaForm({ linhas, onSuccess }: { linhas: Linha[]; onSuccess: () => void }) {
  const { user } = useAuth()
  const [linhaId, setLinhaId] = useState('')
  const [tipo, setTipo] = useState<TipoProblema>('quebrado')
  const [descricao, setDescricao] = useState('')
  const [numeroVeiculo, setNumeroVeiculo] = useState('')
  const [local, setLocal] = useState<{ lat: number; lng: number } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!linhaId) {
      setErro('Selecione a linha.')
      return
    }
    if (!local) {
      setErro('Marque a localização no mapa.')
      return
    }

    setEnviando(true)
    setErro(null)

    const { error } = await supabase.from('denuncias').insert({
      user_id: user.id,
      linha_id: linhaId,
      tipo,
      descricao,
      numero_veiculo: numeroVeiculo.trim() || null,
      latitude: local.lat,
      longitude: local.lng,
    })

    setEnviando(false)

    if (error) {
      setErro('Não foi possível enviar a denúncia. Verifique sua conexão e tente novamente.')
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-brand-green-dark">Linha</label>
        <LinhaSelect linhas={linhas} value={linhaId} onChange={setLinhaId} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-brand-green-dark">
          Tipo de problema
        </label>
        <TipoSelect value={tipo} onChange={setTipo} />
      </div>

      <div>
        <label
          htmlFor="numero-veiculo"
          className="mb-1 block text-sm font-semibold text-brand-green-dark"
        >
          Número do veículo (opcional)
        </label>
        <input
          id="numero-veiculo"
          type="text"
          value={numeroVeiculo}
          onChange={(e) => setNumeroVeiculo(e.target.value)}
          maxLength={20}
          placeholder="Ex.: 12345 (número no painel ou na lateral)"
          className="input-brand"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-brand-green-dark">
          Descrição
        </label>
        <textarea
          required
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="Descreva o que está acontecendo..."
          className="input-brand !py-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-brand-green-dark">
          Localização
        </label>
        <LocationPicker value={local} onChange={(lat, lng) => setLocal({ lat, lng })} />
      </div>

      {erro && <p className="text-sm text-zona-leste">{erro}</p>}

      <Button type="submit" disabled={enviando}>
        {enviando ? 'Enviando...' : 'Enviar denúncia'}
      </Button>
    </form>
  )
}
