export type Zona = 'norte' | 'sul' | 'leste' | 'sudeste' | 'timon' | 'rural' | 'outras'

export type TipoProblema =
  | 'quebrado'
  | 'acidente'
  | 'atraso'
  | 'lotacao'
  | 'nao_passou'
  | 'ar_condicionado'
  | 'gps'
  | 'pcd'
  | 'outro'

/** Tipo de denúncia ligado à acessibilidade para pessoas com deficiência (PcD). */
export const ehAcessibilidade = (tipo: TipoProblema) => tipo === 'pcd'

export type StatusDenuncia = 'pendente' | 'resolvido'

export interface Linha {
  id: string
  codigo: string
  nome: string
  zona: Zona
}

export type Papel = 'user' | 'admin'

export interface Perfil {
  id: string
  email: string
  role: Papel
  banido: boolean
  created_at: string
}

export interface Denuncia {
  id: string
  linha_id: string
  tipo: TipoProblema
  status: StatusDenuncia
  descricao: string
  numero_veiculo?: string | null
  latitude: number
  longitude: number
  created_at: string
  updated_at: string
  /** Quantas pessoas confirmaram com "Também vi". */
  confirmacoes?: number
  linha?: Linha
}

export const ZONA_LABELS: Record<Zona, string> = {
  norte: 'Norte',
  sul: 'Sul',
  leste: 'Leste',
  sudeste: 'Sudeste',
  timon: 'Timon',
  rural: 'Rural',
  outras: 'Outras',
}

export const ZONA_COLORS: Record<Zona, string> = {
  norte: '#1e8e3e',
  sul: '#d9a404',
  leste: '#d64545',
  sudeste: '#2563eb',
  timon: '#0e8a8a',
  rural: '#8a5a2b',
  outras: '#6b5b95',
}

export const TIPO_LABELS: Record<TipoProblema, string> = {
  quebrado: 'Ônibus quebrado',
  acidente: 'Acidente',
  atraso: 'Atraso',
  lotacao: 'Lotação excessiva',
  nao_passou: 'Ônibus não passou',
  ar_condicionado: 'Ar-condicionado quebrado',
  gps: 'GPS/rastreador/letreiro com defeito',
  pcd: 'Acessibilidade (PcD)',
  outro: 'Outro',
}

export const STATUS_LABELS: Record<StatusDenuncia, string> = {
  pendente: 'Pendente',
  resolvido: 'Resolvido',
}

export interface PerfilDetalhes {
  nome: string
  bairro_moradia: string
  local_trabalho: string
  local_estudo: string
}

export type TipoFeedback = 'sugestao' | 'problema' | 'elogio'

export const TIPO_FEEDBACK_LABELS: Record<TipoFeedback, string> = {
  sugestao: 'Sugestão',
  problema: 'Problema no app',
  elogio: 'Elogio',
}

export interface Feedback {
  id: string
  user_id: string | null
  tipo: TipoFeedback
  mensagem: string
  created_at: string
  perfil?: { email: string } | null
}
