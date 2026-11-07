import { supabase } from './supabaseClient'

/** Bucket do Supabase Storage com as fotos das denúncias (ver migration 0029). */
export const BUCKET_FOTOS = 'denuncias-fotos'

/** Lado maior da foto depois de reduzida, em pixels. */
const LADO_MAXIMO = 1280
/** Qualidade do WebP: ~100–200 KB por foto, para caber muitas no 1 GB do plano gratuito. */
const QUALIDADE = 0.7
/** Limite do bucket (512 KB). Se a foto comprimida passar disso, tenta de novo menor. */
const TAMANHO_MAXIMO = 512 * 1024

/** Tamanho máximo do arquivo escolhido, antes de comprimir (fotos de celular costumam ter 2–8 MB). */
export const TAMANHO_MAXIMO_ORIGINAL = 25 * 1024 * 1024

function canvasParaBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade))
}

/**
 * Reduz a foto e converte para WebP (JPEG nos navegadores que não geram WebP). Redesenhar no canvas
 * também descarta os metadados (EXIF), inclusive a localização GPS gravada pela câmera.
 */
export async function comprimirImagem(arquivo: File): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  try {
    for (const lado of [LADO_MAXIMO, 960, 720]) {
      const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(imagem.width * escala))
      canvas.height = Math.max(1, Math.round(imagem.height * escala))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas indisponível')
      ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height)

      let blob = await canvasParaBlob(canvas, 'image/webp', QUALIDADE)
      // Safari antigo ignora o pedido de WebP e devolve PNG: nesse caso usa JPEG.
      if (!blob || blob.type !== 'image/webp') blob = await canvasParaBlob(canvas, 'image/jpeg', QUALIDADE)
      if (!blob) throw new Error('não foi possível converter a imagem')
      if (blob.size <= TAMANHO_MAXIMO) return blob
    }
    throw new Error('imagem grande demais')
  } finally {
    imagem.close()
  }
}

/**
 * Comprime e envia a foto. Devolve o caminho no bucket (`{uuid}.webp`), que vai na denúncia.
 * O nome não leva o id de quem enviou: a autoria das denúncias não é pública.
 */
export async function enviarFoto(arquivo: File): Promise<{ path: string | null; error: string | null }> {
  let blob: Blob
  try {
    blob = await comprimirImagem(arquivo)
  } catch {
    return { path: null, error: 'Não foi possível ler a foto. Tente outra imagem.' }
  }
  const extensao = blob.type === 'image/jpeg' ? 'jpg' : 'webp'
  const path = `${crypto.randomUUID()}.${extensao}`
  const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(path, blob, {
    contentType: blob.type,
    // A foto nunca muda (o nome é novo a cada envio): cache longo poupa o tráfego de saída.
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) {
    return { path: null, error: 'Não foi possível enviar a foto. Tente novamente ou envie sem foto.' }
  }
  return { path, error: null }
}

/** URL pública da foto (o bucket é público; a imagem é servida com cache de CDN). */
export function urlFoto(path: string) {
  return supabase.storage.from(BUCKET_FOTOS).getPublicUrl(path).data.publicUrl
}

/** Apaga fotos do bucket. Lista vazia não chama a API. */
export async function removerFotos(paths: (string | null | undefined)[]) {
  const validos = paths.filter((p): p is string => !!p)
  if (validos.length === 0) return { error: null }
  const { error } = await supabase.storage.from(BUCKET_FOTOS).remove(validos)
  return { error }
}

/**
 * Apaga todas as fotos de uma pessoa antes de excluir a conta: as que estão em denúncias (consulta
 * no banco, vale para o admin excluindo outra pessoa) e, quando é a própria conta, também as que
 * ficaram soltas no bucket (envio que não virou denúncia).
 */
export async function removerFotosDoUsuario(userId: string, propriaConta: boolean) {
  const { data, error } = await supabase.rpc('fotos_do_usuario', { alvo: userId })
  if (error) return { error }
  const paths = new Set((data as string[] | null) ?? [])
  if (propriaConta) {
    // Sem pasta: a listagem da raiz só traz os arquivos da própria pessoa (regra de acesso do bucket).
    const { data: arquivos, error: erroLista } = await supabase.storage
      .from(BUCKET_FOTOS)
      .list('', { limit: 1000 })
    if (erroLista) return { error: erroLista }
    for (const a of arquivos ?? []) paths.add(a.name)
  }
  return removerFotos([...paths])
}

/** Caminho da foto de uma denúncia que ainda está na fila de aprovação (só o autor e o admin leem). */
async function fotoNaFila(denunciaId: string) {
  const { data } = await supabase
    .from('fotos_pendentes')
    .select('foto_path')
    .eq('denuncia_id', denunciaId)
    .maybeSingle()
  return (data as { foto_path: string } | null)?.foto_path ?? null
}

/**
 * Exclui a denúncia e apaga a foto dela do Storage, publicada ou ainda na fila. O arquivo não some
 * junto com a denúncia: o Storage só apaga pela API.
 */
export async function excluirDenunciaComFoto(id: string, fotoPath?: string | null) {
  const pendente = await fotoNaFila(id)
  const { error } = await supabase.from('denuncias').delete().eq('id', id)
  if (error) return { error }
  await removerFotos([fotoPath, pendente])
  return { error: null }
}

/** Tira a foto publicada da denúncia (dono ou admin), mantendo a denúncia, e apaga o arquivo. */
export async function removerFotoDaDenuncia(id: string, fotoPath: string) {
  const { error } = await supabase.from('denuncias').update({ foto_path: null }).eq('id', id)
  if (error) return { error }
  await removerFotos([fotoPath])
  return { error: null }
}

/** Admin: publica a foto que estava na fila. */
export async function aprovarFoto(denunciaId: string) {
  const { error } = await supabase.rpc('aprovar_foto', { p_denuncia_id: denunciaId })
  return { error }
}

/** Admin: recusa a foto da fila e apaga o arquivo. */
export async function recusarFoto(denunciaId: string) {
  const { data, error } = await supabase.rpc('recusar_foto', { p_denuncia_id: denunciaId })
  if (error) return { error }
  await removerFotos([data as string | null])
  return { error: null }
}

/** Admin: caminhos de arquivos do bucket que nenhuma denúncia usa (até 1000, com mais de 1 dia). */
export async function listarFotosOrfas() {
  const { data, error } = await supabase.rpc('fotos_orfas')
  if (error) return { paths: [] as string[], error }
  return { paths: (data as string[] | null) ?? [], error: null }
}

/** Admin: apaga do Storage os arquivos órfãos. Devolve quantos foram apagados. */
export async function limparFotosOrfas() {
  const { paths, error } = await listarFotosOrfas()
  if (error) return { apagadas: 0, error }
  if (paths.length === 0) return { apagadas: 0, error: null }
  const { error: erroRemocao } = await removerFotos(paths)
  if (erroRemocao) return { apagadas: 0, error: erroRemocao }
  return { apagadas: paths.length, error: null }
}
