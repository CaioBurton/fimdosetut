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
import type { ResumoPainel } from './resumoPainel'

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

export type ResultadoCompartilhamento = 'compartilhado' | 'baixado' | 'cancelado'

/**
 * Abre o compartilhamento do celular (Instagram, WhatsApp etc.) com a imagem; onde isso não existe
 * (computador), baixa o arquivo para a pessoa postar.
 */
export async function compartilharImagem(
  blob: Blob,
  nomeArquivo: string,
  { titulo: tituloCompartilhamento, texto: textoCompartilhamento }: { titulo: string; texto: string }
): Promise<ResultadoCompartilhamento> {
  const arquivo = new File([blob], nomeArquivo, { type: blob.type || 'image/png' })
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: tituloCompartilhamento, text: textoCompartilhamento })
      return 'compartilhado'
    } catch (erro) {
      if (erro instanceof DOMException && erro.name === 'AbortError') return 'cancelado'
      // qualquer outra falha do compartilhamento nativo cai no download
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'baixado'
}

/** Texto que acompanha a imagem ao compartilhar. */
export const textoDenuncia = (d: DadosCartaoDenuncia) =>
  `Deu prego na linha ${d.codigo} (${TIPO_LABELS[d.tipo].toLowerCase()}). Veja e confirme no Deu o Prego!: ${SITE_URL}`

export const textoRanking = (d: DadosCartaoRanking) =>
  `Ranking das linhas com mais denúncias em Teresina (${d.recorte.toLowerCase()}). Veja no Deu o Prego!: ${SITE_URL}`
