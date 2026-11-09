import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChainable, createSupabaseMock } from '../test/supabaseMock'
import { supabase } from './supabaseClient'
import {
  aprovarFoto,
  enviarFoto,
  excluirDenunciaComFoto,
  recusarFoto,
  removerFotoDaDenuncia,
  removerFotos,
  removerFotosDoUsuario,
  urlFoto,
} from './fotosDenuncias'

vi.mock('./supabaseClient', () => ({ supabase: createSupabaseMock() }))

const bucket = () => supabase.storage.from('denuncias-fotos')

describe('fotosDenuncias', () => {
  beforeEach(() => {
    vi.mocked(bucket().remove).mockClear()
    vi.mocked(bucket().list).mockClear()
    vi.mocked(bucket().upload).mockClear()
    vi.mocked(supabase.rpc).mockReset()
  })

  it('monta a URL pública da foto', () => {
    expect(urlFoto('abc.webp')).toContain('/denuncias-fotos/abc.webp')
  })

  it('não chama o Storage quando não há foto para remover', async () => {
    await removerFotos([null, undefined])
    expect(bucket().remove).not.toHaveBeenCalled()
    await removerFotos(['a.webp', null])
    expect(bucket().remove).toHaveBeenCalledWith(['a.webp'])
  })

  it('na própria conta, apaga as fotos das denúncias e as que ficaram soltas no bucket', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: ['a.webp', 'b.webp'], error: null } as never)
    vi.mocked(bucket().list).mockResolvedValue({ data: [{ name: 'b.webp' }, { name: 'c.webp' }], error: null } as never)

    const { error } = await removerFotosDoUsuario('u1', true)

    expect(error).toBeNull()
    expect(supabase.rpc).toHaveBeenCalledWith('fotos_do_usuario', { alvo: 'u1' })
    expect(bucket().remove).toHaveBeenCalledWith(['a.webp', 'b.webp', 'c.webp'])
  })

  it('o admin apaga só as fotos das denúncias do usuário (sem listar o bucket)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: ['a.webp'], error: null } as never)

    await removerFotosDoUsuario('u2', false)

    expect(bucket().list).not.toHaveBeenCalled()
    expect(bucket().remove).toHaveBeenCalledWith(['a.webp'])
  })

  it('não apaga nada quando a consulta das fotos falha', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'falhou' } } as never)

    const { error } = await removerFotosDoUsuario('u1', true)

    expect(error).toEqual({ message: 'falhou' })
    expect(bucket().remove).not.toHaveBeenCalled()
  })

  it('avisa quando a imagem não pode ser lida, sem enviar nada', async () => {
    // O jsdom não decodifica imagens (createImageBitmap não existe): cai no caminho de erro.
    const { path, error } = await enviarFoto(new File(['x'], 'foto.jpg', { type: 'image/jpeg' }))

    expect(path).toBeNull()
    expect(error).toMatch(/não foi possível ler a foto/i)
    expect(bucket().upload).not.toHaveBeenCalled()
  })

  it('comprime, envia com nome aleatório e cache longo', async () => {
    const close = vi.fn()
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 4000, height: 3000, close }))
    const drawImage = vi.fn()
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage } as never)
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((cb) => cb(new Blob(['x'.repeat(1000)], { type: 'image/webp' })))

    const { path, error } = await enviarFoto(new File(['x'], 'foto.jpg', { type: 'image/jpeg' }))

    expect(error).toBeNull()
    expect(path).toMatch(/^[0-9a-f-]{36}\.webp$/)
    // Lado maior reduzido para 1280 px, mantendo a proporção.
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1280, 960)
    expect(bucket().upload).toHaveBeenCalledWith(
      path,
      expect.any(Blob),
      expect.objectContaining({ contentType: 'image/webp', cacheControl: '31536000', upsert: false })
    )
    expect(close).toHaveBeenCalled()

    getContext.mockRestore()
    toBlob.mockRestore()
    vi.unstubAllGlobals()
  })
})

describe('moderação de fotos', () => {
  beforeEach(() => {
    vi.mocked(bucket().remove).mockClear()
    vi.mocked(supabase.rpc).mockReset()
    vi.mocked(supabase.from).mockReset()
  })

  it('ao excluir a denúncia, apaga também a foto que ainda estava na fila', async () => {
    const fila = createChainable({ data: { foto_path: 'fila.webp' } })
    const exclusao = createChainable({ data: null })
    vi.mocked(supabase.from).mockReturnValueOnce(fila as never).mockReturnValueOnce(exclusao as never)

    const { error } = await excluirDenunciaComFoto('d1', 'publicada.webp')

    expect(error).toBeNull()
    expect(supabase.from).toHaveBeenNthCalledWith(1, 'fotos_pendentes')
    expect(exclusao.delete).toHaveBeenCalled()
    expect(bucket().remove).toHaveBeenCalledWith(['publicada.webp', 'fila.webp'])
  })

  it('não apaga a foto quando a exclusão da denúncia falha', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(createChainable({ data: null }) as never)
      .mockReturnValueOnce(createChainable({ error: { message: 'negado' } }) as never)

    const { error } = await excluirDenunciaComFoto('d1', 'publicada.webp')

    expect(error).toEqual({ message: 'negado' })
    expect(bucket().remove).not.toHaveBeenCalled()
  })

  it('remover só a foto limpa a coluna e apaga o arquivo, mantendo a denúncia', async () => {
    const atualizacao = createChainable({ data: null })
    vi.mocked(supabase.from).mockReturnValueOnce(atualizacao as never)

    await removerFotoDaDenuncia('d1', 'a.webp')

    expect(atualizacao.update).toHaveBeenCalledWith({ foto_path: null })
    expect(atualizacao.delete).not.toHaveBeenCalled()
    expect(bucket().remove).toHaveBeenCalledWith(['a.webp'])
  })

  it('recusar tira da fila e apaga o arquivo; aprovar não apaga nada', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: 'fila.webp', error: null } as never)
    await recusarFoto('d1')
    expect(supabase.rpc).toHaveBeenCalledWith('recusar_foto', { p_denuncia_id: 'd1' })
    expect(bucket().remove).toHaveBeenCalledWith(['fila.webp'])

    vi.mocked(bucket().remove).mockClear()
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: null } as never)
    await aprovarFoto('d2')
    expect(supabase.rpc).toHaveBeenCalledWith('aprovar_foto', { p_denuncia_id: 'd2' })
    expect(bucket().remove).not.toHaveBeenCalled()
  })
})

describe('fotos arquivadas no R2', () => {
  it('monta a URL do R2 para caminhos com r2:', () => {
    vi.stubEnv('VITE_FOTOS_ARQUIVO_URL', 'https://fotos.exemplo.com/')
    expect(urlFoto('r2:abc.webp')).toBe('https://fotos.exemplo.com/abc.webp')
    expect(urlFoto('abc.webp')).toContain('/denuncias-fotos/abc.webp')
    vi.unstubAllEnvs()
  })

  it('não tenta apagar do Supabase as fotos que já estão no R2', async () => {
    vi.mocked(bucket().remove).mockClear()
    await removerFotos(['r2:velha.webp', 'nova.webp'])
    expect(bucket().remove).toHaveBeenCalledWith(['nova.webp'])

    vi.mocked(bucket().remove).mockClear()
    await removerFotos(['r2:velha.webp'])
    expect(bucket().remove).not.toHaveBeenCalled()
  })
})
