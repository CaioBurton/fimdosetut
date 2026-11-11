import { STATUS_LABELS, TIPO_LABELS, ZONA_LABELS, type Denuncia } from '../types'

const SEPARADOR = ';' // o Excel em português espera ponto e vírgula

const COLUNAS = [
  'Data',
  'Hora',
  'Linha',
  'Nome da linha',
  'Zona',
  'Tipo',
  'Status',
  'Número do veículo',
  'Descrição',
  'Latitude',
  'Longitude',
  'Confirmações (Também vi)',
]

/** Escapa uma célula; textos que começam com = + - @ ganham um apóstrofo para o Excel não
 * executá-los como fórmula (as descrições vêm de qualquer pessoa). */
function celula(valor: string | number | null | undefined) {
  let texto = valor == null ? '' : String(valor)
  if (typeof valor === 'string' && /^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

function dataHora(iso: string) {
  const d = new Date(iso)
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const p = (tipo: string) => partes.find((x) => x.type === tipo)?.value ?? ''
  return { data: `${p('day')}/${p('month')}/${p('year')}`, hora: `${p('hour')}:${p('minute')}` }
}

/** Monta o CSV das denúncias (uma por linha), no fuso de Teresina. */
export function denunciasParaCsv(denuncias: Denuncia[]) {
  const linhas = denuncias.map((d) => {
    const { data, hora } = dataHora(d.created_at)
    return [
      data,
      hora,
      d.linha?.codigo ?? '',
      d.local_tipo === 'parada' ? `Parada${d.referencia_parada ? `: ${d.referencia_parada}` : ''}` : (d.linha?.nome ?? ''),
      ZONA_LABELS[d.linha?.zona ?? 'outras'],
      TIPO_LABELS[d.tipo],
      STATUS_LABELS[d.status],
      d.numero_veiculo?.trim() ?? '',
      d.descricao,
      d.latitude,
      d.longitude,
      d.confirmacoes ?? 0,
    ]
      .map(celula)
      .join(SEPARADOR)
  })
  return [COLUNAS.map(celula).join(SEPARADOR), ...linhas].join('\r\n')
}
