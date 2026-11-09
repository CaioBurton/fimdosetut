import { describe, expect, it } from 'vitest'
import { arquivarFotos, limparArquivo } from './nucleo.mjs'

const AGORA = new Date('2026-11-07T12:00:00Z')
const DIAS_ATRAS = (n) => new Date(AGORA.getTime() - n * 24 * 60 * 60 * 1000)

/** Supabase e R2 de mentira, em memória. */
function montar({ denuncias = [], supabase = {}, r2 = {}, falhas = {} } = {}) {
  const estado = {
    denuncias: denuncias.map((d) => ({ ...d })),
    supabase: new Map(Object.entries(supabase)),
    r2: new Map(Object.entries(r2)),
  }
  const db = {
    async listarParaArquivar(corte, limite) {
      return estado.denuncias
        .filter((d) => d.foto_path && !d.foto_path.startsWith('r2:') && d.created_at < corte)
        .slice(0, limite)
        .map(({ id, foto_path }) => ({ id, foto_path }))
    },
    async marcarArquivada(id, path) {
      if (falhas.denunciaMudou) return false
      const d = estado.denuncias.find((x) => x.id === id && x.foto_path === path)
      if (!d) return false
      d.foto_path = `r2:${path}`
      return true
    },
    async referenciasArquivadas() {
      return new Set(
        estado.denuncias.filter((d) => d.foto_path?.startsWith('r2:')).map((d) => d.foto_path.slice(3))
      )
    },
  }
  const origem = {
    async baixar(path) {
      if (!estado.supabase.has(path)) throw new Error('não encontrado')
      return estado.supabase.get(path)
    },
    async apagar(paths) {
      if (falhas.apagarSupabase) throw new Error('rede')
      for (const p of paths) estado.supabase.delete(p)
    },
  }
  const destino = {
    async enviar(chave, bytes) {
      if (falhas.enviarR2) throw new Error('R2 fora do ar')
      estado.r2.set(chave, { bytes: falhas.copiaCorrompida ? bytes.slice(1) : bytes, modificadoEm: AGORA })
    },
    async tamanho(chave) {
      return estado.r2.get(chave)?.bytes.byteLength ?? null
    },
    async listar() {
      return [...estado.r2].map(([chave, v]) => ({ chave, modificadoEm: v.modificadoEm }))
    },
    async apagar(chave) {
      estado.r2.delete(chave)
    },
  }
  return { estado, db, origem, destino }
}

const bytes = (n) => new Uint8Array(n).fill(7)
const silencioso = () => {}

describe('arquivarFotos', () => {
  it('move só as fotos antigas: copia, confere, marca r2: e apaga do Supabase', async () => {
    const { estado, ...adaptadores } = montar({
      denuncias: [
        { id: 'velha', foto_path: 'a.webp', created_at: DIAS_ATRAS(40).toISOString() },
        { id: 'nova', foto_path: 'b.webp', created_at: DIAS_ATRAS(5).toISOString() },
      ],
      supabase: { 'a.webp': bytes(100), 'b.webp': bytes(80) },
    })

    const r = await arquivarFotos({ ...adaptadores, agora: AGORA, dias: 30, log: silencioso })

    expect(r).toEqual({ arquivadas: 1, falhas: 0, ignoradas: 0 })
    expect(estado.denuncias[0].foto_path).toBe('r2:a.webp')
    expect(estado.denuncias[1].foto_path).toBe('b.webp')
    expect(estado.r2.get('a.webp').bytes.byteLength).toBe(100)
    expect(estado.supabase.has('a.webp')).toBe(false)
    expect(estado.supabase.has('b.webp')).toBe(true)
  })

  it('não toca na denúncia nem apaga do Supabase quando o R2 falha', async () => {
    const { estado, ...adaptadores } = montar({
      denuncias: [{ id: 'd1', foto_path: 'a.webp', created_at: DIAS_ATRAS(40).toISOString() }],
      supabase: { 'a.webp': bytes(100) },
      falhas: { enviarR2: true },
    })

    const r = await arquivarFotos({ ...adaptadores, agora: AGORA, log: silencioso })

    expect(r.falhas).toBe(1)
    expect(estado.denuncias[0].foto_path).toBe('a.webp')
    expect(estado.supabase.has('a.webp')).toBe(true)
  })

  it('não troca a foto quando a cópia no R2 não confere', async () => {
    const { estado, ...adaptadores } = montar({
      denuncias: [{ id: 'd1', foto_path: 'a.webp', created_at: DIAS_ATRAS(40).toISOString() }],
      supabase: { 'a.webp': bytes(100) },
      falhas: { copiaCorrompida: true },
    })

    const r = await arquivarFotos({ ...adaptadores, agora: AGORA, log: silencioso })

    expect(r.falhas).toBe(1)
    expect(estado.denuncias[0].foto_path).toBe('a.webp')
    expect(estado.supabase.has('a.webp')).toBe(true)
  })

  it('descarta a cópia quando a denúncia mudou no meio do caminho', async () => {
    const { estado, ...adaptadores } = montar({
      denuncias: [{ id: 'd1', foto_path: 'a.webp', created_at: DIAS_ATRAS(40).toISOString() }],
      supabase: { 'a.webp': bytes(100) },
      falhas: { denunciaMudou: true },
    })

    const r = await arquivarFotos({ ...adaptadores, agora: AGORA, log: silencioso })

    expect(r.ignoradas).toBe(1)
    expect(estado.r2.has('a.webp')).toBe(false)
    expect(estado.supabase.has('a.webp')).toBe(true)
  })

  it('conta como arquivada mesmo se apagar do Supabase falhar (vira órfã, limpa no admin)', async () => {
    const logs = []
    const { estado, ...adaptadores } = montar({
      denuncias: [{ id: 'd1', foto_path: 'a.webp', created_at: DIAS_ATRAS(40).toISOString() }],
      supabase: { 'a.webp': bytes(100) },
      falhas: { apagarSupabase: true },
    })

    const r = await arquivarFotos({ ...adaptadores, agora: AGORA, log: (m) => logs.push(m) })

    expect(r.arquivadas).toBe(1)
    expect(estado.denuncias[0].foto_path).toBe('r2:a.webp')
    expect(logs.join('\n')).toMatch(/Fotos órfãs/)
  })

  it('na simulação não muda nada', async () => {
    const { estado, ...adaptadores } = montar({
      denuncias: [{ id: 'd1', foto_path: 'a.webp', created_at: DIAS_ATRAS(40).toISOString() }],
      supabase: { 'a.webp': bytes(100) },
    })

    await arquivarFotos({ ...adaptadores, agora: AGORA, simular: true, log: silencioso })

    expect(estado.denuncias[0].foto_path).toBe('a.webp')
    expect(estado.r2.size).toBe(0)
  })
})

describe('limparArquivo', () => {
  it('apaga do R2 só os arquivos sem denúncia e com mais de 1 dia', async () => {
    const { estado, db, destino } = montar({
      denuncias: [{ id: 'd1', foto_path: 'r2:usada.webp', created_at: DIAS_ATRAS(40).toISOString() }],
    })
    estado.r2.set('usada.webp', { bytes: bytes(1), modificadoEm: DIAS_ATRAS(10) })
    estado.r2.set('sobrou.webp', { bytes: bytes(1), modificadoEm: DIAS_ATRAS(10) })
    estado.r2.set('recente.webp', { bytes: bytes(1), modificadoEm: AGORA })

    const r = await limparArquivo({ db, destino, agora: AGORA, log: silencioso })

    expect(r.apagados).toBe(1)
    expect([...estado.r2.keys()].sort()).toEqual(['recente.webp', 'usada.webp'])
  })

  it('para tudo quando apagaria mais da metade do bucket (provável erro no banco)', async () => {
    const { estado, db, destino } = montar()
    for (let i = 0; i < 30; i++) estado.r2.set(`f${i}.webp`, { bytes: bytes(1), modificadoEm: DIAS_ATRAS(10) })

    await expect(limparArquivo({ db, destino, agora: AGORA, log: silencioso })).rejects.toThrow(/Nada foi apagado/)
    expect(estado.r2.size).toBe(30)

    const r = await limparArquivo({ db, destino, agora: AGORA, forcar: true, log: silencioso })
    expect(r.apagados).toBe(30)
  })
})
