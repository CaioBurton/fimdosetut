/**
 * Lógica do arquivamento de fotos no R2, sem saber de Supabase nem de R2: recebe "adaptadores"
 * (ver ../arquivar-fotos.mjs), o que permite testar tudo sem rede (nucleo.test.mjs).
 *
 * Adaptadores esperados:
 *   db.listarParaArquivar(corteIso, limite)  -> [{ id, foto_path }]   (publicadas, sem `r2:`)
 *   db.marcarArquivada(id, path)             -> boolean               (false se a foto mudou)
 *   db.referenciasArquivadas()               -> Set<string>           (nomes, sem o `r2:`)
 *   origem.baixar(path)                      -> Uint8Array
 *   origem.apagar(paths)                     -> void
 *   destino.enviar(chave, bytes, tipo)       -> void
 *   destino.tamanho(chave)                   -> number | null
 *   destino.listar()                         -> [{ chave, modificadoEm: Date }]
 *   destino.apagar(chave)                    -> void
 */

export const PREFIXO_R2 = 'r2:'

export function tipoDoArquivo(path) {
  return path.endsWith('.jpg') ? 'image/jpeg' : 'image/webp'
}

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Copia para o R2 as fotos publicadas há mais de `dias` dias. A ordem garante que nada se perde:
 * 1) baixa do Supabase, 2) envia ao R2, 3) confere o tamanho da cópia, 4) marca a denúncia com
 * `r2:` (só se a foto ainda for a mesma), 5) só então apaga do Supabase.
 * Se algo falha antes do passo 4, a foto continua no Supabase e tenta de novo na próxima vez.
 * Se o passo 5 falha, o arquivo fica sobrando no Supabase e aparece em "Fotos órfãs" no admin.
 */
export async function arquivarFotos({ db, origem, destino, agora = new Date(), dias = 30, limite = 300, simular = false, log = console.log }) {
  const corte = new Date(agora.getTime() - dias * DIA_MS).toISOString()
  const fotos = await db.listarParaArquivar(corte, limite)
  const resultado = { arquivadas: 0, falhas: 0, ignoradas: 0 }
  log(`${fotos.length} foto(s) publicadas antes de ${corte.slice(0, 10)} para arquivar.`)

  for (const { id, foto_path: path } of fotos) {
    if (simular) {
      log(`[simulação] arquivaria ${path}`)
      continue
    }
    try {
      const bytes = await origem.baixar(path)
      await destino.enviar(path, bytes, tipoDoArquivo(path))
      const tamanho = await destino.tamanho(path)
      if (tamanho !== bytes.byteLength) {
        throw new Error(`cópia no R2 com ${tamanho} bytes, esperado ${bytes.byteLength}`)
      }
      const marcada = await db.marcarArquivada(id, path)
      if (!marcada) {
        // A foto foi removida ou a denúncia apagada enquanto o script rodava: descarta a cópia.
        await destino.apagar(path)
        resultado.ignoradas++
        log(`ignorada ${path}: a denúncia mudou durante o arquivamento`)
        continue
      }
      try {
        await origem.apagar([path])
      } catch (erro) {
        log(`arquivada ${path}, mas não saiu do Supabase (${erro.message}); limpe em Admin > Fotos órfãs`)
      }
      resultado.arquivadas++
    } catch (erro) {
      resultado.falhas++
      log(`FALHA ${path}: ${erro.message}`)
    }
  }
  return resultado
}

/**
 * Apaga do R2 os arquivos que nenhuma denúncia usa mais (denúncia ou conta excluída, foto
 * removida pelo admin). Só arquivos com mais de 1 dia, e para tudo se a conta parecer errada:
 * se mais da metade do bucket fosse ser apagada, é mais provável um erro na consulta ao banco.
 */
export async function limparArquivo({ db, destino, agora = new Date(), simular = false, forcar = false, log = console.log }) {
  const referencias = await db.referenciasArquivadas()
  const arquivos = await destino.listar()
  const limiteIdade = agora.getTime() - DIA_MS
  const sobrando = arquivos.filter(
    (a) => !referencias.has(a.chave) && a.modificadoEm.getTime() < limiteIdade
  )
  log(`${arquivos.length} arquivo(s) no R2, ${sobrando.length} sem denúncia.`)

  if (!forcar && sobrando.length > 20 && sobrando.length > arquivos.length / 2) {
    throw new Error(
      `${sobrando.length} de ${arquivos.length} arquivos seriam apagados do R2. Nada foi apagado. ` +
        'Confira o banco; se estiver certo, rode de novo com --forcar.'
    )
  }

  let apagados = 0
  for (const { chave } of sobrando) {
    if (simular) {
      log(`[simulação] apagaria do R2 ${chave}`)
      continue
    }
    await destino.apagar(chave)
    apagados++
  }
  return { apagados }
}
