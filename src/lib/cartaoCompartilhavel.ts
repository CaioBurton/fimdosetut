import {
  STATUS_LABELS,
  TIPO_LABELS,
  ZONA_COLORS,
  ZONA_LABELS,
  type Denuncia,
  type StatusDenuncia,
  type TipoProblema,
  type Zona,
} from '../types'
import { PERIODO_LABELS, type Periodo } from './dashboardDenuncias'
import { EXPLOSAO_PATH, SITE_HOST, SITE_URL } from './marca'
import type { LinhaEmAlta } from './rankingSemana'
import { taxaResolucao, type ResumoPainel } from './resumoPainel'

/**
 * Cartões compartilháveis: imagens PNG 1080×1350 (4:5, o formato do feed do Instagram, que também
 * fica bem no WhatsApp) com a identidade visual do Fórum. São desenhadas no próprio navegador, num
 * <canvas>, sem enviar nada a nenhum servidor. Só entram dados que já são públicos no app: o
 * cartão nunca leva autoria.
 */

export const LARGURA = 1080
export const ALTURA = 1350
const MARGEM = 72

const VERDE = '#084400'
const VERDE_ESCURO = '#052d00'
const VERDE_MEDIO = '#307800'
const CREME = '#f3fcee'
const VERMELHO = '#c23838'
const CINZA = '#4b5563'

const FONTE = '"Proxima Nova", system-ui, sans-serif'
const titulo = (px: number) => `italic 700 ${px}px ${FONTE}`
const texto = (px: number, peso = 600) => `${peso} ${px}px ${FONTE}`

/** Contexto de desenho usado pelos cartões (o subconjunto do canvas 2D de que precisam). */
export type Contexto = CanvasRenderingContext2D

// ---------- Dados ----------

export interface DadosCartaoDenuncia {
  codigo: string
  nomeLinha: string
  zona: Zona
  tipo: TipoProblema
  status: StatusDenuncia
  descricao: string
  /** Data e hora já formatadas, ex.: "07:42 · 02/11". */
  quando: string
  veiculo: string | null
  confirmacoes: number
}

export function formatarQuando(iso: string) {
  const d = new Date(iso)
  const dois = (n: number) => String(n).padStart(2, '0')
  return `${dois(d.getHours())}:${dois(d.getMinutes())} · ${dois(d.getDate())}/${dois(d.getMonth() + 1)}`
}

export function dadosDoCartao(denuncia: Denuncia): DadosCartaoDenuncia {
  return {
    codigo: denuncia.linha?.codigo ?? '—',
    nomeLinha: denuncia.linha?.nome ?? 'Linha removida',
    zona: denuncia.linha?.zona ?? 'outras',
    tipo: denuncia.tipo,
    status: denuncia.status,
    descricao: denuncia.descricao,
    quando: formatarQuando(denuncia.created_at),
    veiculo: denuncia.numero_veiculo?.trim() || null,
    confirmacoes: denuncia.confirmacoes ?? 0,
  }
}

export interface DadosCartaoRanking {
  /** Ex.: "Últimos 30 dias · Todas as zonas". */
  recorte: string
  total: number
  pendentes: number
  linhas: { codigo: string; nome: string; total: number }[]
}

const MAX_LINHAS_RANKING = 5

export function dadosDoRanking(resumo: ResumoPainel, periodo: Periodo, zona: Zona | 'todas'): DadosCartaoRanking {
  const zonaTexto = zona === 'todas' ? 'Todas as zonas' : `Zona ${ZONA_LABELS[zona]}`
  return {
    recorte: `${PERIODO_LABELS[periodo]} · ${zonaTexto}`,
    total: resumo.total,
    pendentes: resumo.pendentes,
    linhas: resumo.topLinhas.slice(0, MAX_LINHAS_RANKING).map((l) => ({ codigo: l.codigo, nome: l.nome, total: l.total })),
  }
}

export interface DadosCartaoSemana {
  codigo: string
  nomeLinha: string
  zona: Zona
  denuncias: number
  pessoas: number
  confirmacoes: number
}

/** Só totais: quem denunciou nunca entra no cartão. */
export const dadosDaLinhaSemana = (l: LinhaEmAlta): DadosCartaoSemana => ({
  codigo: l.codigo,
  nomeLinha: l.nome,
  zona: l.zona,
  denuncias: l.denuncias,
  pessoas: l.pessoas,
  confirmacoes: l.confirmacoes,
})

// ---------- Cartões das seções do painel ----------

const pluralizar = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

const textoZona = (zona: Zona | 'todas') => (zona === 'todas' ? 'Todas as zonas' : `Zona ${ZONA_LABELS[zona]}`)

/** Ex.: "Últimos 30 dias · Todas as zonas". */
export const recorteDoPainel = (periodo: Periodo, zona: Zona | 'todas') => `${PERIODO_LABELS[periodo]} · ${textoZona(zona)}`

/** Cartão de uma seção do painel (a base do resumo semanal para o Instagram). */
export type DadosCartaoPainel = {
  titulo: string
  recorte: string
  /** Linha de fechamento, logo acima do rodapé. */
  fecho: string
} & (
  | { tipo: 'resumo'; total: number; pendentes: number; resolvidas: number; hoje: number; taxa: number }
  | { tipo: 'serie'; itens: { rotulo: string; total: number }[]; rotuloACada: number }
  | { tipo: 'barras'; itens: { rotulo: string; total: number }[] }
  | {
      tipo: 'acessibilidade'
      total: number
      linhas: { codigo: string; nome: string; total: number }[]
      veiculos: { numero: string; total: number }[]
    }
)

const MAX_BARRAS = 7
const MAX_ITENS_ACESSIBILIDADE = 3

export function dadosDoResumo(resumo: ResumoPainel, periodo: Periodo, zona: Zona | 'todas'): DadosCartaoPainel {
  return {
    tipo: 'resumo',
    titulo: 'Resumo',
    recorte: recorteDoPainel(periodo, zona),
    fecho: `${pluralizar(resumo.total, 'denúncia', 'denúncias')} no período`,
    total: resumo.total,
    pendentes: resumo.pendentes,
    resolvidas: resumo.resolvidas,
    hoje: resumo.hoje,
    taxa: taxaResolucao(resumo),
  }
}

export function dadosPorDia(resumo: ResumoPainel, zona: Zona | 'todas'): DadosCartaoPainel {
  const soma = resumo.porDia.reduce((a, d) => a + d.total, 0)
  return {
    tipo: 'serie',
    titulo: 'Denúncias por dia',
    recorte: `Últimos ${resumo.porDia.length} dias · ${textoZona(zona)}`,
    fecho: `${pluralizar(soma, 'denúncia', 'denúncias')} em ${resumo.porDia.length} dias`,
    itens: resumo.porDia.map((d) => ({ rotulo: String(d.data.getDate()), total: d.total })),
    rotuloACada: 1,
  }
}

export function dadosPorHora(horas: number[], diaTexto: string): DadosCartaoPainel {
  const total = horas.reduce((a, b) => a + b, 0)
  return {
    tipo: 'serie',
    titulo: 'Denúncias ao longo do dia',
    recorte: diaTexto,
    fecho: pluralizar(total, 'denúncia', 'denúncias'),
    itens: horas.map((total, h) => ({ rotulo: `${h}h`, total })),
    rotuloACada: 3,
  }
}

export function dadosPorZona(resumo: ResumoPainel, periodo: Periodo, zona: Zona | 'todas'): DadosCartaoPainel {
  return {
    tipo: 'barras',
    titulo: 'Por zona',
    recorte: recorteDoPainel(periodo, zona),
    fecho: `${pluralizar(resumo.total, 'denúncia', 'denúncias')} no período`,
    itens: resumo.porZona.slice(0, MAX_BARRAS).map((i) => ({ rotulo: ZONA_LABELS[i.chave], total: i.total })),
  }
}

export function dadosPorTipo(resumo: ResumoPainel, periodo: Periodo, zona: Zona | 'todas'): DadosCartaoPainel {
  return {
    tipo: 'barras',
    titulo: 'Por tipo de problema',
    recorte: recorteDoPainel(periodo, zona),
    fecho: `${pluralizar(resumo.total, 'denúncia', 'denúncias')} no período`,
    itens: resumo.porTipo.slice(0, MAX_BARRAS).map((i) => ({ rotulo: TIPO_LABELS[i.chave], total: i.total })),
  }
}

export function dadosDaAcessibilidade(resumo: ResumoPainel, periodo: Periodo, zona: Zona | 'todas'): DadosCartaoPainel {
  const a = resumo.acessibilidade
  return {
    tipo: 'acessibilidade',
    titulo: 'Acessibilidade (PcD)',
    recorte: recorteDoPainel(periodo, zona),
    fecho: `${pluralizar(a.total, 'ocorrência', 'ocorrências')} · ${pluralizar(a.pendentes, 'pendente', 'pendentes')}`,
    total: a.total,
    linhas: a.topLinhas.slice(0, MAX_ITENS_ACESSIBILIDADE).map((l) => ({ codigo: l.codigo, nome: l.nome, total: l.total })),
    veiculos: a.topVeiculos.slice(0, MAX_ITENS_ACESSIBILIDADE).map((v) => ({ numero: v.numero, total: v.total })),
  }
}

// ---------- Texto ----------

/** Corta o texto com reticências até caber em `larguraMax` (na fonte atual do contexto). */
export function ajustarTexto(ctx: Contexto, valor: string, larguraMax: number) {
  if (ctx.measureText(valor).width <= larguraMax) return valor
  let corte = valor.length
  while (corte > 0 && ctx.measureText(`${valor.slice(0, corte).trimEnd()}…`).width > larguraMax) corte--
  return corte > 0 ? `${valor.slice(0, corte).trimEnd()}…` : '…'
}

/** Quebra o texto em linhas que cabem em `larguraMax`; passando de `maxLinhas`, a última termina em "…". */
export function quebrarTexto(ctx: Contexto, valor: string, larguraMax: number, maxLinhas: number) {
  const palavras = valor.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  const linhas: string[] = []
  let atual = ''
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra
    if (ctx.measureText(tentativa).width <= larguraMax || !atual) {
      atual = tentativa
    } else {
      linhas.push(atual)
      atual = palavra
    }
  }
  if (atual) linhas.push(atual)
  if (linhas.length <= maxLinhas) return linhas
  const visiveis = linhas.slice(0, maxLinhas)
  visiveis[maxLinhas - 1] = ajustarTexto(ctx, `${visiveis[maxLinhas - 1]} ${linhas.slice(maxLinhas).join(' ')}`, larguraMax)
  return visiveis
}

// ---------- Desenho ----------

function fundoComExplosao(ctx: Contexto) {
  ctx.fillStyle = VERDE
  ctx.fillRect(0, 0, LARGURA, ALTURA)
  if (typeof Path2D === 'undefined') return
  // Explosão em tom sobre tom, como nas peças da identidade visual.
  ctx.save()
  ctx.translate(LARGURA - 560, -70)
  ctx.scale(2.4, 2.4)
  ctx.globalAlpha = 0.5
  ctx.fillStyle = VERDE_MEDIO
  ctx.fill(new Path2D(EXPLOSAO_PATH))
  ctx.restore()
  ctx.save()
  ctx.translate(-120, ALTURA - 330)
  ctx.scale(1.6, 1.6)
  ctx.globalAlpha = 0.35
  ctx.fillStyle = VERDE_MEDIO
  ctx.fill(new Path2D(EXPLOSAO_PATH))
  ctx.restore()
}

function cabecalho(ctx: Contexto) {
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = CREME
  ctx.font = titulo(52)
  ctx.fillText('DEU O PREGO!', MARGEM, 118)
  ctx.font = texto(30)
  ctx.globalAlpha = 0.85
  ctx.fillText('Feito por quem pega ônibus em Teresina', MARGEM, 166)
  ctx.globalAlpha = 1
}

function rodape(ctx: Contexto, logo: CanvasImageSource | null, chamada: string) {
  const y = ALTURA - 150
  ctx.fillStyle = CREME
  ctx.textAlign = 'left'
  ctx.font = texto(34, 700)
  ctx.fillText(chamada, MARGEM, y)
  ctx.font = titulo(46)
  ctx.fillText(SITE_HOST, MARGEM, y + 66)
  if (logo) {
    const l = 270
    const a = (l * 184.5) / 486
    ctx.drawImage(logo, LARGURA - MARGEM - l, ALTURA - MARGEM - a, l, a)
  }
}

function cartaoCreme(ctx: Contexto, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = VERDE_ESCURO
  ctx.fillRect(x + 14, y + 14, w, h)
  ctx.fillStyle = CREME
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = VERDE_ESCURO
  ctx.lineWidth = 6
  ctx.strokeRect(x, y, w, h)
}

export function desenharCartaoDenuncia(ctx: Contexto, d: DadosCartaoDenuncia, logo: CanvasImageSource | null) {
  fundoComExplosao(ctx)
  cabecalho(ctx)

  // Título: o tipo de problema, bem grande.
  ctx.fillStyle = CREME
  ctx.font = titulo(124)
  const linhasTitulo = quebrarTexto(ctx, TIPO_LABELS[d.tipo].toUpperCase(), LARGURA - MARGEM * 2, 3)
  let y = 330
  for (const linha of linhasTitulo) {
    ctx.fillText(linha, MARGEM, y)
    y += 118
  }

  // Cartão da linha.
  const yCartao = y - 118 + 56
  const altCartao = 300
  const larguraCartao = LARGURA - MARGEM * 2 - 14
  cartaoCreme(ctx, MARGEM, yCartao, larguraCartao, altCartao)

  ctx.fillStyle = VERDE
  ctx.font = titulo(112)
  ctx.fillText(d.codigo, MARGEM + 40, yCartao + 128)

  // Selo de status, à direita.
  const rotuloStatus = STATUS_LABELS[d.status].toUpperCase()
  ctx.font = titulo(30)
  const larguraSelo = ctx.measureText(rotuloStatus).width + 48
  ctx.fillStyle = d.status === 'resolvido' ? CINZA : VERMELHO
  ctx.fillRect(MARGEM + larguraCartao - 40 - larguraSelo, yCartao + 44, larguraSelo, 56)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.fillText(rotuloStatus, MARGEM + larguraCartao - 40 - larguraSelo / 2, yCartao + 84)
  ctx.textAlign = 'left'

  ctx.fillStyle = VERDE_ESCURO
  ctx.font = texto(40, 700)
  const nome = quebrarTexto(ctx, d.nomeLinha, larguraCartao - 80, 2)
  nome.forEach((linha, i) => ctx.fillText(linha, MARGEM + 40, yCartao + 188 + i * 46))

  const yInfo = yCartao + altCartao - 30
  ctx.fillStyle = ZONA_COLORS[d.zona]
  ctx.beginPath()
  ctx.arc(MARGEM + 52, yInfo - 11, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = VERDE_ESCURO
  ctx.font = texto(32, 700)
  const info = [`Zona ${ZONA_LABELS[d.zona]}`, d.quando, d.veiculo ? `Veículo ${d.veiculo}` : null].filter(Boolean).join('  ·  ')
  ctx.fillText(ajustarTexto(ctx, info, larguraCartao - 130), MARGEM + 80, yInfo)

  // Descrição.
  const yDescricao = yCartao + altCartao + 90
  const yLimite = ALTURA - 330 - (d.confirmacoes > 0 ? 70 : 0)
  const maxLinhas = Math.max(1, Math.min(5, Math.floor((yLimite - yDescricao) / 54) + 1))
  ctx.fillStyle = CREME
  ctx.font = texto(42)
  quebrarTexto(ctx, `“${d.descricao.trim()}”`, LARGURA - MARGEM * 2, maxLinhas).forEach((linha, i) =>
    ctx.fillText(linha, MARGEM, yDescricao + i * 56)
  )

  if (d.confirmacoes > 0) {
    ctx.font = titulo(40)
    const t = d.confirmacoes === 1 ? '1 PESSOA TAMBÉM VIU' : `${d.confirmacoes} PESSOAS TAMBÉM VIRAM`
    ctx.fillText(t, MARGEM, ALTURA - 290)
  }

  rodape(ctx, logo, 'Viu isso também? Confirme no app:')
}

export function desenharCartaoRanking(ctx: Contexto, d: DadosCartaoRanking, logo: CanvasImageSource | null) {
  fundoComExplosao(ctx)
  cabecalho(ctx)

  ctx.fillStyle = CREME
  ctx.font = titulo(116)
  ctx.fillText('RANKING DAS', MARGEM, 300)
  ctx.fillText('LINHAS', MARGEM, 410)
  ctx.font = texto(36, 700)
  ctx.fillText(ajustarTexto(ctx, d.recorte, LARGURA - MARGEM * 2), MARGEM, 474)

  const x0 = MARGEM
  const yLista = 530
  const alturaLinha = 104
  if (d.linhas.length === 0) {
    ctx.font = texto(44, 700)
    ctx.fillText('Sem denúncias no período.', x0, yLista + 60)
  }
  const max = Math.max(1, ...d.linhas.map((l) => l.total))
  const larguraBarraMax = LARGURA - MARGEM * 2 - 150 - 130
  d.linhas.forEach((l, i) => {
    const y = yLista + i * alturaLinha
    ctx.textAlign = 'left'
    ctx.fillStyle = CREME
    ctx.globalAlpha = i === 0 ? 1 : 0.55
    ctx.font = titulo(76)
    ctx.fillText(String(i + 1), x0, y + 60)
    ctx.globalAlpha = 1

    ctx.font = texto(36, 700)
    ctx.fillText(ajustarTexto(ctx, `${l.codigo} · ${l.nome}`, LARGURA - MARGEM * 2 - 150 - 130), x0 + 100, y + 38)

    ctx.globalAlpha = 0.25
    ctx.fillRect(x0 + 100, y + 58, larguraBarraMax, 26)
    ctx.globalAlpha = 1
    ctx.fillRect(x0 + 100, y + 58, Math.max(10, (l.total / max) * larguraBarraMax), 26)

    ctx.textAlign = 'right'
    ctx.font = titulo(64)
    ctx.fillText(String(l.total), LARGURA - MARGEM, y + 62)
  })
  ctx.textAlign = 'left'

  ctx.fillStyle = CREME
  ctx.font = texto(34, 700)
  const pend = d.pendentes === 1 ? '1 pendente' : `${d.pendentes} pendentes`
  const tot = d.total === 1 ? '1 denúncia' : `${d.total} denúncias`
  ctx.fillText(ajustarTexto(ctx, `${tot} no período · ${pend}`, LARGURA - MARGEM * 2), MARGEM, ALTURA - 250)

  rodape(ctx, logo, 'Acompanhe e denuncie:')
}

export function desenharCartaoSemana(ctx: Contexto, d: DadosCartaoSemana, logo: CanvasImageSource | null) {
  fundoComExplosao(ctx)
  cabecalho(ctx)

  ctx.fillStyle = CREME
  ctx.font = texto(36, 700)
  ctx.fillText('ÚLTIMOS 7 DIAS', MARGEM, 290)
  ctx.font = titulo(104)
  ctx.fillText('LINHA MAIS', MARGEM, 400)
  ctx.fillText('PROBLEMÁTICA', MARGEM, 504)
  ctx.fillText('DA SEMANA', MARGEM, 608)

  const yCartao = 680
  const altCartao = 300
  const larguraCartao = LARGURA - MARGEM * 2 - 14
  cartaoCreme(ctx, MARGEM, yCartao, larguraCartao, altCartao)

  ctx.fillStyle = VERDE
  ctx.font = titulo(112)
  ctx.fillText(d.codigo, MARGEM + 40, yCartao + 128)

  ctx.fillStyle = VERDE_ESCURO
  ctx.font = texto(40, 700)
  quebrarTexto(ctx, d.nomeLinha, larguraCartao - 80, 2).forEach((linha, i) =>
    ctx.fillText(linha, MARGEM + 40, yCartao + 188 + i * 46)
  )

  const yInfo = yCartao + altCartao - 30
  ctx.fillStyle = ZONA_COLORS[d.zona]
  ctx.beginPath()
  ctx.arc(MARGEM + 52, yInfo - 11, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = VERDE_ESCURO
  ctx.font = texto(32, 700)
  ctx.fillText(`Zona ${ZONA_LABELS[d.zona]}`, MARGEM + 80, yInfo)

  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
  ctx.fillStyle = CREME
  ctx.font = titulo(46)
  ctx.fillText(
    ajustarTexto(ctx, `${plural(d.denuncias, 'DENÚNCIA', 'DENÚNCIAS')} DE ${plural(d.pessoas, 'PESSOA', 'PESSOAS')}`.toUpperCase(), LARGURA - MARGEM * 2),
    MARGEM,
    yCartao + altCartao + 100
  )
  if (d.confirmacoes > 0) {
    ctx.font = texto(36, 700)
    ctx.fillText(plural(d.confirmacoes, 'confirmação', 'confirmações'), MARGEM, yCartao + altCartao + 160)
  }

  rodape(ctx, logo, 'Pega essa linha? Confirme no app:')
}

/** Desenha título e recorte; devolve o y onde começa o conteúdo do cartão. */
function tituloDoCartaoPainel(ctx: Contexto, d: DadosCartaoPainel) {
  ctx.fillStyle = CREME
  ctx.textAlign = 'left'
  ctx.font = titulo(100)
  const linhas = quebrarTexto(ctx, d.titulo.toUpperCase(), LARGURA - MARGEM * 2, 2)
  linhas.forEach((linha, i) => ctx.fillText(linha, MARGEM, 290 + i * 106))
  const yRecorte = 290 + (linhas.length - 1) * 106 + 64
  ctx.font = texto(36, 700)
  ctx.fillText(ajustarTexto(ctx, d.recorte, LARGURA - MARGEM * 2), MARGEM, yRecorte)
  return yRecorte + 70
}

function conteudoResumo(ctx: Contexto, d: Extract<DadosCartaoPainel, { tipo: 'resumo' }>, y0: number) {
  const largura = LARGURA - MARGEM * 2
  ctx.font = texto(32, 700)
  ctx.fillText('PENDENTES AGORA', MARGEM, y0 + 10)
  ctx.font = titulo(230)
  ctx.fillText(String(d.pendentes), MARGEM, y0 + 230)

  ctx.globalAlpha = 0.25
  ctx.fillRect(MARGEM, y0 + 270, largura, 28)
  ctx.globalAlpha = 1
  ctx.fillRect(MARGEM, y0 + 270, (largura * d.taxa) / 100, 28)
  ctx.font = texto(32, 700)
  ctx.fillText(`${d.taxa}% resolvidas`, MARGEM, y0 + 345)

  const folga = 28
  const w = (largura - 14 - 2 * folga) / 3
  const kpis: [string, number][] = [
    ['TOTAL', d.total],
    ['RESOLVIDAS', d.resolvidas],
    ['HOJE', d.hoje],
  ]
  kpis.forEach(([rotulo, valor], i) => {
    const x = MARGEM + i * (w + folga)
    cartaoCreme(ctx, x, y0 + 390, w, 150)
    ctx.fillStyle = VERDE_ESCURO
    ctx.font = texto(24, 700)
    ctx.fillText(rotulo, x + 24, y0 + 390 + 48)
    ctx.fillStyle = VERDE
    ctx.font = titulo(72)
    ctx.fillText(String(valor), x + 24, y0 + 390 + 122)
  })
  ctx.fillStyle = CREME
}

function conteudoSerie(ctx: Contexto, d: Extract<DadosCartaoPainel, { tipo: 'serie' }>, y0: number) {
  const largura = LARGURA - MARGEM * 2
  const n = Math.max(1, d.itens.length)
  const slot = largura / n
  const larguraBarra = slot * 0.7
  const base = y0 + 470
  const alturaMax = 400
  const max = Math.max(1, ...d.itens.map((i) => i.total))
  ctx.textAlign = 'center'
  d.itens.forEach((item, i) => {
    const h = (item.total / max) * alturaMax
    const cx = MARGEM + i * slot + slot / 2
    ctx.globalAlpha = i === d.itens.length - 1 ? 1 : 0.6
    ctx.fillRect(cx - larguraBarra / 2, base - h, larguraBarra, Math.max(h, item.total > 0 ? 6 : 2))
    ctx.globalAlpha = 1
    if (item.total > 0) {
      ctx.font = texto(n > 16 ? 22 : 28, 700)
      ctx.fillText(String(item.total), cx, base - h - 12)
    }
    if (i % d.rotuloACada === 0) {
      ctx.font = texto(24, 600)
      ctx.globalAlpha = 0.85
      ctx.fillText(item.rotulo, cx, base + 40)
      ctx.globalAlpha = 1
    }
  })
  ctx.fillRect(MARGEM, base, largura, 4)
  ctx.textAlign = 'left'
}

function conteudoBarras(ctx: Contexto, d: Extract<DadosCartaoPainel, { tipo: 'barras' }>, y0: number) {
  if (d.itens.length === 0) {
    ctx.font = texto(44, 700)
    ctx.fillText('Sem denúncias no período.', MARGEM, y0 + 60)
    return
  }
  const alturaLinha = d.itens.length <= 5 ? 104 : 80
  const larguraBarraMax = LARGURA - MARGEM * 2
  const max = Math.max(1, ...d.itens.map((i) => i.total))
  d.itens.forEach((item, i) => {
    const y = y0 + i * alturaLinha
    ctx.textAlign = 'left'
    ctx.font = texto(36, 700)
    ctx.fillText(ajustarTexto(ctx, item.rotulo, larguraBarraMax - 140), MARGEM, y + 34)
    ctx.globalAlpha = 0.25
    ctx.fillRect(MARGEM, y + 50, larguraBarraMax, 22)
    ctx.globalAlpha = i === 0 ? 1 : 0.8
    ctx.fillRect(MARGEM, y + 50, Math.max(10, (item.total / max) * larguraBarraMax), 22)
    ctx.globalAlpha = 1
    ctx.textAlign = 'right'
    ctx.font = titulo(52)
    ctx.fillText(String(item.total), LARGURA - MARGEM, y + 40)
  })
  ctx.textAlign = 'left'
}

function conteudoAcessibilidade(ctx: Contexto, d: Extract<DadosCartaoPainel, { tipo: 'acessibilidade' }>, y0: number) {
  if (d.total === 0) {
    ctx.font = texto(44, 700)
    quebrarTexto(ctx, 'Nenhum problema de acessibilidade registrado no período.', LARGURA - MARGEM * 2, 3).forEach((linha, i) =>
      ctx.fillText(linha, MARGEM, y0 + 60 + i * 60)
    )
    return
  }
  const largura = LARGURA - MARGEM * 2
  const secao = (cabecalhoSecao: string, itens: [string, number][], vazio: string, y: number) => {
    ctx.textAlign = 'left'
    ctx.font = texto(28, 700)
    ctx.globalAlpha = 0.8
    ctx.fillText(cabecalhoSecao.toUpperCase(), MARGEM, y)
    ctx.globalAlpha = 1
    if (itens.length === 0) {
      ctx.font = texto(34, 600)
      ctx.fillText(vazio, MARGEM, y + 64)
      return
    }
    itens.forEach(([rotulo, total], i) => {
      const yy = y + 64 + i * 66
      ctx.textAlign = 'left'
      ctx.font = texto(36, 700)
      ctx.fillText(ajustarTexto(ctx, rotulo, largura - 120), MARGEM, yy)
      ctx.textAlign = 'right'
      ctx.font = titulo(50)
      ctx.fillText(String(total), LARGURA - MARGEM, yy + 2)
    })
    ctx.textAlign = 'left'
  }
  secao(
    'Linhas com mais ocorrências',
    d.linhas.map((l) => [`${l.codigo} · ${l.nome}`, l.total]),
    'Sem dados.',
    y0 + 20
  )
  secao(
    'Veículos com mais ocorrências',
    d.veiculos.map((v) => [`Veículo ${v.numero}`, v.total]),
    'Nenhuma denúncia informou o veículo.',
    y0 + 20 + 64 + Math.max(1, d.linhas.length) * 66 + 50
  )
}

export function desenharCartaoPainel(ctx: Contexto, d: DadosCartaoPainel, logo: CanvasImageSource | null) {
  fundoComExplosao(ctx)
  cabecalho(ctx)
  const y0 = tituloDoCartaoPainel(ctx, d)
  ctx.fillStyle = CREME
  if (d.tipo === 'resumo') conteudoResumo(ctx, d, y0)
  else if (d.tipo === 'serie') conteudoSerie(ctx, d, y0)
  else if (d.tipo === 'barras') conteudoBarras(ctx, d, y0)
  else conteudoAcessibilidade(ctx, d, y0)

  ctx.fillStyle = CREME
  ctx.textAlign = 'left'
  ctx.font = texto(34, 700)
  ctx.fillText(ajustarTexto(ctx, d.fecho, LARGURA - MARGEM * 2), MARGEM, ALTURA - 250)
  rodape(ctx, logo, 'Acompanhe e denuncie:')
}

// ---------- Geração e compartilhamento ----------

async function prepararFontes() {
  try {
    await Promise.all(
      ['700', '600', '400'].map((peso) => document.fonts.load(`${peso} 48px "Proxima Nova"`))
    )
  } catch {
    // sem as fontes do app, o navegador usa a fonte padrão: o cartão sai, só menos fiel
  }
}

function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function gerarPng(desenhar: (ctx: Contexto, logo: CanvasImageSource | null) => void): Promise<Blob> {
  const [logo] = await Promise.all([carregarImagem('/brand/logo-horizontal-claro.svg'), prepararFontes()])
  const canvas = document.createElement('canvas')
  canvas.width = LARGURA
  canvas.height = ALTURA
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas indisponível')
  desenhar(ctx, logo)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('não foi possível gerar a imagem'))), 'image/png')
  )
}

export const gerarCartaoDenuncia = (denuncia: Denuncia) =>
  gerarPng((ctx, logo) => desenharCartaoDenuncia(ctx, dadosDoCartao(denuncia), logo))

export const gerarCartaoRanking = (resumo: ResumoPainel, periodo: Periodo, zona: Zona | 'todas') =>
  gerarPng((ctx, logo) => desenharCartaoRanking(ctx, dadosDoRanking(resumo, periodo, zona), logo))

export const gerarCartaoSemana = (linha: LinhaEmAlta) =>
  gerarPng((ctx, logo) => desenharCartaoSemana(ctx, dadosDaLinhaSemana(linha), logo))

export const gerarCartaoPainel = (dados: DadosCartaoPainel) =>
  gerarPng((ctx, logo) => desenharCartaoPainel(ctx, dados, logo))

export type ResultadoCompartilhamento = 'compartilhado' | 'baixado' | 'cancelado'

/**
 * Abre o compartilhamento do celular (Instagram, WhatsApp etc.) com a imagem; onde isso não existe
 * (computador), baixa o arquivo para a pessoa postar.
 */
export async function compartilharImagem(
  blob: Blob,
  nomeArquivo: string,
  textos: { titulo: string; texto: string }
): Promise<ResultadoCompartilhamento> {
  return compartilharImagens([{ blob, nome: nomeArquivo }], textos)
}

/**
 * Como `compartilharImagem`, mas com várias imagens de uma vez (o carrossel do Instagram). Onde não
 * há compartilhamento nativo, baixa uma por uma.
 */
export async function compartilharImagens(
  imagens: { blob: Blob; nome: string }[],
  { titulo: tituloCompartilhamento, texto: textoCompartilhamento }: { titulo: string; texto: string }
): Promise<ResultadoCompartilhamento> {
  const arquivos = imagens.map((i) => new File([i.blob], i.nome, { type: i.blob.type || 'image/png' }))
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: arquivos })) {
    try {
      await navigator.share({ files: arquivos, title: tituloCompartilhamento, text: textoCompartilhamento })
      return 'compartilhado'
    } catch (erro) {
      if (erro instanceof DOMException && erro.name === 'AbortError') return 'cancelado'
      // qualquer outra falha do compartilhamento nativo cai no download
    }
  }
  for (const [i, imagem] of imagens.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 350)) // o navegador bloqueia downloads em rajada
    const url = URL.createObjectURL(imagem.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = imagem.nome
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return 'baixado'
}

/**
 * Gera o carrossel do resumo semanal: um cartão por seção do painel, na ordem em que aparecem.
 * Seções sem dados (linha da semana, acessibilidade e ranking vazios) ficam de fora.
 */
export async function gerarCarrossel(
  resumo: ResumoPainel,
  periodo: Periodo,
  zona: Zona | 'todas',
  linhaDaSemana: LinhaEmAlta | null = null
) {
  const cartoes: { nome: string; dados: DadosCartaoPainel | null; ranking?: boolean; semana?: boolean }[] = [
    { nome: 'resumo', dados: dadosDoResumo(resumo, periodo, zona) },
    { nome: 'linha-da-semana', dados: null, semana: linhaDaSemana !== null },
    { nome: 'por-dia', dados: dadosPorDia(resumo, zona) },
    { nome: 'por-zona', dados: dadosPorZona(resumo, periodo, zona) },
    { nome: 'por-tipo', dados: dadosPorTipo(resumo, periodo, zona) },
    { nome: 'acessibilidade', dados: resumo.acessibilidade.total > 0 ? dadosDaAcessibilidade(resumo, periodo, zona) : null },
    { nome: 'ranking', dados: null, ranking: resumo.topLinhas.length > 0 },
  ]
  const imagens: { blob: Blob; nome: string }[] = []
  for (const [i, c] of cartoes.entries()) {
    let blob: Blob | null = null
    if (c.dados) blob = await gerarCartaoPainel(c.dados)
    else if (c.semana && linhaDaSemana) blob = await gerarCartaoSemana(linhaDaSemana)
    else if (c.ranking) blob = await gerarCartaoRanking(resumo, periodo, zona)
    if (blob) imagens.push({ blob, nome: `deu-o-prego-${String(i + 1).padStart(2, '0')}-${c.nome}.png` })
  }
  return imagens
}

export const textoCarrossel = (periodo: Periodo, zona: Zona | 'todas') =>
  `Resumo do Deu o Prego! em Teresina (${recorteDoPainel(periodo, zona).toLowerCase()}). Veja no app: ${SITE_URL}`

/** Texto que acompanha a imagem ao compartilhar. */
export const textoDenuncia = (d: DadosCartaoDenuncia) =>
  `Deu prego na linha ${d.codigo} (${TIPO_LABELS[d.tipo].toLowerCase()}). Veja e confirme no Deu o Prego!: ${SITE_URL}`

export const textoRanking = (d: DadosCartaoRanking) =>
  `Ranking das linhas com mais denúncias em Teresina (${d.recorte.toLowerCase()}). Veja no Deu o Prego!: ${SITE_URL}`

export const textoSemana = (d: DadosCartaoSemana) =>
  `A linha ${d.codigo} (${d.nomeLinha}) é a mais problemática da semana em Teresina. Veja e confirme no Deu o Prego!: ${SITE_URL}`

export const textoPainel = (d: DadosCartaoPainel) =>
  `${d.titulo} em Teresina (${d.recorte.toLowerCase()}). Veja no Deu o Prego!: ${SITE_URL}`
