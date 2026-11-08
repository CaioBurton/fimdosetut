import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Denuncia } from '../types'
import {
  ajustarTexto,
  compartilharImagem,
  dadosDaAcessibilidade,
  dadosDoCartao,
  dadosDoResumo,
  dadosPorDia,
  dadosPorHora,
  dadosPorTipo,
  dadosPorZona,
  desenharCartaoPainel,
  textoPainel,
  dadosDoRanking,
  desenharCartaoDenuncia,
  desenharCartaoRanking,
  quebrarTexto,
  textoDenuncia,
  type Contexto,
} from './cartaoCompartilhavel'
import { RESUMO_VAZIO } from './resumoPainel'

/** Contexto falso: cada letra mede 10 px e as chamadas de desenho ficam registradas. */
function contextoFalso() {
  const textos: string[] = []
  const ctx = {
    measureText: (t: string) => ({ width: t.length * 10 }),
    fillText: (t: string) => textos.push(t),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fill: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as Contexto
  return { ctx, textos }
}

const denuncia: Denuncia = {
  id: 'd1',
  linha_id: 'l1',
  tipo: 'quebrado',
  status: 'pendente',
  descricao: 'Ônibus parado na pista.',
  numero_veiculo: ' 12345 ',
  latitude: -5.09,
  longitude: -42.8,
  created_at: '2026-11-02T07:42:00',
  updated_at: '2026-11-02T07:42:00',
  confirmacoes: 3,
  linha: { id: 'l1', codigo: '103', nome: 'MOCAMBINHO-ALTO ALEGRE', zona: 'norte' },
}

describe('texto dos cartões', () => {
  it('ajustarTexto devolve o texto inteiro quando cabe e corta com reticências quando não cabe', () => {
    const { ctx } = contextoFalso()

    expect(ajustarTexto(ctx, 'curto', 100)).toBe('curto')
    const cortado = ajustarTexto(ctx, 'um texto bem comprido', 100)
    expect(cortado.endsWith('…')).toBe(true)
    expect(cortado.length * 10).toBeLessThanOrEqual(100)
  })

  it('quebrarTexto divide em linhas e limita o total com reticências', () => {
    const { ctx } = contextoFalso()

    expect(quebrarTexto(ctx, 'aaaa bbbb cccc', 90, 5)).toEqual(['aaaa bbbb', 'cccc'])
    const limitado = quebrarTexto(ctx, 'aaaa bbbb cccc dddd eeee', 50, 2)
    expect(limitado).toHaveLength(2)
    expect(limitado[1].endsWith('…')).toBe(true)
  })

  it('quebrarTexto não perde uma palavra maior que a linha', () => {
    const { ctx } = contextoFalso()

    expect(quebrarTexto(ctx, 'supercalifragilistico ok', 50, 5)).toEqual(['supercalifragilistico', 'ok'])
  })
})

describe('dados dos cartões', () => {
  it('monta o cartão da denúncia só com dados públicos', () => {
    const dados = dadosDoCartao(denuncia)

    expect(dados).toEqual({
      codigo: '103',
      nomeLinha: 'MOCAMBINHO-ALTO ALEGRE',
      zona: 'norte',
      tipo: 'quebrado',
      status: 'pendente',
      descricao: 'Ônibus parado na pista.',
      quando: '07:42 · 02/11',
      veiculo: '12345',
      confirmacoes: 3,
    })
  })

  it('cai em valores seguros quando a linha foi removida', () => {
    const dados = dadosDoCartao({ ...denuncia, linha: undefined, numero_veiculo: null, confirmacoes: undefined })

    expect(dados.codigo).toBe('—')
    expect(dados.nomeLinha).toBe('Linha removida')
    expect(dados.zona).toBe('outras')
    expect(dados.veiculo).toBeNull()
    expect(dados.confirmacoes).toBe(0)
  })

  it('o ranking leva no máximo 5 linhas e descreve o recorte', () => {
    const topLinhas = Array.from({ length: 8 }, (_, i) => ({ linhaId: `l${i}`, codigo: `${i}`, nome: `Linha ${i}`, total: 10 - i }))
    const dados = dadosDoRanking({ ...RESUMO_VAZIO, total: 40, pendentes: 12, topLinhas }, '30d', 'norte')

    expect(dados.linhas).toHaveLength(5)
    expect(dados.recorte).toBe('Últimos 30 dias · Zona Norte')
    expect(dados.total).toBe(40)
    expect(dados.pendentes).toBe(12)
  })

  it('o texto que acompanha a imagem cita a linha, o tipo e o endereço do app', () => {
    const texto = textoDenuncia(dadosDoCartao(denuncia))

    expect(texto).toContain('linha 103')
    expect(texto).toContain('ônibus quebrado')
    expect(texto).toContain('https://deuoprego.com.br')
  })
})

describe('desenho dos cartões', () => {
  it('o cartão da denúncia escreve tipo, linha, status, descrição e o endereço do app', () => {
    const { ctx, textos } = contextoFalso()

    desenharCartaoDenuncia(ctx, dadosDoCartao(denuncia), null)

    const tudo = textos.join(' | ')
    expect(tudo).toContain('ÔNIBUS')
    expect(tudo).toContain('103')
    expect(tudo).toContain('MOCAMBINHO-ALTO ALEGRE')
    expect(tudo).toContain('PENDENTE')
    expect(tudo).toContain('Ônibus parado na pista.')
    expect(tudo).toContain('3 PESSOAS TAMBÉM VIRAM')
    expect(tudo).toContain('deuoprego.com.br')
  })

  it('só desenha o logo quando ele carregou', () => {
    const sem = contextoFalso()
    desenharCartaoDenuncia(sem.ctx, dadosDoCartao(denuncia), null)
    expect(sem.ctx.drawImage).not.toHaveBeenCalled()

    const com = contextoFalso()
    desenharCartaoDenuncia(com.ctx, dadosDoCartao(denuncia), {} as CanvasImageSource)
    expect(com.ctx.drawImage).toHaveBeenCalledTimes(1)
  })

  it('o ranking escreve as linhas na ordem, com os totais', () => {
    const { ctx, textos } = contextoFalso()

    desenharCartaoRanking(
      ctx,
      {
        recorte: 'Últimos 7 dias · Todas as zonas',
        total: 10,
        pendentes: 1,
        linhas: [
          { codigo: '103', nome: 'MOCAMBINHO', total: 6 },
          { codigo: '200', nome: 'CENTRO', total: 4 },
        ],
      },
      null
    )

    expect(textos).toContain('RANKING DAS')
    expect(textos.findIndex((t) => t.startsWith('103'))).toBeLessThan(textos.findIndex((t) => t.startsWith('200')))
    expect(textos).toContain('6')
    expect(textos.some((t) => t.includes('10 denúncias') && t.includes('1 pendente'))).toBe(true)
  })

  it('o ranking vazio avisa que não há denúncias', () => {
    const { ctx, textos } = contextoFalso()

    desenharCartaoRanking(ctx, { recorte: 'Hoje · Todas as zonas', total: 0, pendentes: 0, linhas: [] }, null)

    expect(textos).toContain('Sem denúncias no período.')
  })
})

describe('cartões das seções do painel', () => {
  const resumo = {
    ...RESUMO_VAZIO,
    total: 10,
    pendentes: 4,
    resolvidas: 6,
    hoje: 2,
    porZona: [{ chave: 'norte' as const, total: 7 }, { chave: 'sul' as const, total: 3 }],
    porTipo: [{ chave: 'quebrado' as const, total: 10 }],
    porDia: [{ data: new Date(2026, 10, 7), total: 3 }, { data: new Date(2026, 10, 8), total: 5 }],
    acessibilidade: {
      total: 2,
      pendentes: 1,
      topLinhas: [{ linhaId: 'l1', codigo: '103', nome: 'MOCAMBINHO', total: 2 }],
      topVeiculos: [{ numero: '12345', total: 2 }],
    },
  }

  const desenhar = (dados: ReturnType<typeof dadosDoResumo>) => {
    const { ctx, textos } = contextoFalso()
    desenharCartaoPainel(ctx, dados, null)
    return textos.join(' | ')
  }

  it('resumo mostra pendentes, taxa e KPIs', () => {
    const t = desenhar(dadosDoResumo(resumo, '7d', 'todas'))
    expect(t).toContain('RESUMO')
    expect(t).toContain('PENDENTES AGORA')
    expect(t).toContain('60% resolvidas')
    expect(t).toContain('10 denúncias no período')
  })

  it('por dia, por hora, zona e tipo desenham os rótulos e totais', () => {
    expect(desenhar(dadosPorDia(resumo, 'norte'))).toContain('Zona Norte')
    expect(desenhar(dadosPorHora(new Array(24).fill(1), 'Hoje'))).toContain('0h')
    const zona = desenhar(dadosPorZona(resumo, '30d', 'todas'))
    expect(zona).toContain('POR ZONA')
    expect(zona).toContain('Norte')
    expect(desenhar(dadosPorTipo(resumo, '30d', 'todas'))).toContain('POR TIPO DE PROBLEMA')
  })

  it('acessibilidade lista linhas e veículos; vazia avisa', () => {
    const t = desenhar(dadosDaAcessibilidade(resumo, '7d', 'todas'))
    expect(t).toContain('103 · MOCAMBINHO')
    expect(t).toContain('Veículo 12345')
    expect(desenhar(dadosDaAcessibilidade(RESUMO_VAZIO, '7d', 'todas'))).toContain('Nenhum problema de acessibilidade')
  })

  it('texto do compartilhamento leva título, recorte e o site', () => {
    expect(textoPainel(dadosPorZona(resumo, '7d', 'todas'))).toMatch(/^Por zona em Teresina \(.*\)\. Veja no Deu o Prego!: https?:\/\//)
  })
})

describe('compartilharImagem', () => {
  const blob = new Blob(['x'], { type: 'image/png' })
  const mensagem = { titulo: 'Deu o Prego!', texto: 'texto' }

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:falso')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined })
    vi.restoreAllMocks()
  })

  it('usa o compartilhamento do celular quando ele aceita arquivos', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })

    expect(await compartilharImagem(blob, 'a.png', mensagem)).toBe('compartilhado')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'Deu o Prego!', text: 'texto' }))
    expect(share.mock.calls[0][0].files[0].name).toBe('a.png')
  })

  it('devolve "cancelado" quando a pessoa fecha o compartilhamento', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new DOMException('cancelado', 'AbortError')),
    })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })

    expect(await compartilharImagem(blob, 'a.png', mensagem)).toBe('cancelado')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('baixa o arquivo quando o aparelho não compartilha arquivos', async () => {
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    expect(await compartilharImagem(blob, 'a.png', mensagem)).toBe('baixado')
    expect(clique).toHaveBeenCalledTimes(1)
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
  })

  it('baixa o arquivo quando o compartilhamento nativo falha por outro motivo', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new DOMException('bloqueado', 'NotAllowedError')),
    })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    expect(await compartilharImagem(blob, 'a.png', mensagem)).toBe('baixado')
  })
})
