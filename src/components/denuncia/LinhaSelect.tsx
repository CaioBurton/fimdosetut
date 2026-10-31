import { ZONA_LABELS, type Linha, type Zona } from '../../types'

const ORDEM_ZONAS: Zona[] = ['norte', 'sul', 'leste', 'sudeste', 'outras']

interface LinhaSelectProps {
  linhas: Linha[]
  value: string
  onChange: (linhaId: string) => void
}

export function LinhaSelect({ linhas, value, onChange }: LinhaSelectProps) {
  const porZona = ORDEM_ZONAS.map((zona) => ({
    zona,
    linhas: linhas.filter((linha) => linha.zona === zona),
  })).filter((grupo) => grupo.linhas.length > 0)

  return (
    <select
      required
      aria-label="Linha"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-brand-green/30 bg-white px-3 py-3 text-base text-brand-green-dark"
    >
      <option value="" disabled>
        Selecione a linha do ônibus
      </option>
      {porZona.map((grupo) => (
        <optgroup key={grupo.zona} label={`Zona ${ZONA_LABELS[grupo.zona]}`}>
          {grupo.linhas.map((linha) => (
            <option key={linha.id} value={linha.id}>
              {linha.codigo} - {linha.nome}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
