export type Zona = 'norte' | 'sul' | 'leste' | 'sudeste' | 'outras'

export type TipoProblema = 'quebrado' | 'acidente' | 'atraso' | 'lotacao' | 'outro'

export type StatusDenuncia = 'pendente' | 'resolvido'

export interface Linha {
  id: string
  codigo: string
  nome: string
  zona: Zona
}

export interface Denuncia {
  id: string
  user_id: string
  linha_id: string
  tipo: TipoProblema
  status: StatusDenuncia
  descricao: string
  latitude: number
  longitude: number
  created_at: string
  updated_at: string
  linha?: Linha
}

export const ZONA_LABELS: Record<Zona, string> = {
  norte: 'Norte',
  sul: 'Sul',
  leste: 'Leste',
  sudeste: 'Sudeste',
  outras: 'Outras',
}

export const ZONA_COLORS: Record<Zona, string> = {
  norte: '#1e8e3e',
  sul: '#d9a404',
  leste: '#d64545',
  sudeste: '#2563eb',
  outras: '#6b5b95',
}

export const TIPO_LABELS: Record<TipoProblema, string> = {
  quebrado: 'Ônibus quebrado',
  acidente: 'Acidente',
  atraso: 'Atraso',
  lotacao: 'Lotação excessiva',
  outro: 'Outro',
}

export const STATUS_LABELS: Record<StatusDenuncia, string> = {
  pendente: 'Pendente',
  resolvido: 'Resolvido',
}
