#!/usr/bin/env node
/**
 * Arquiva no Cloudflare R2 as fotos antigas das denúncias, para o Supabase Storage (1 GB no plano
 * gratuito) guardar só as recentes. Nenhuma foto é perdida: a denúncia passa a apontar para o R2
 * (`foto_path = 'r2:<arquivo>'`) e o app monta a URL de lá (VITE_FOTOS_ARQUIVO_URL).
 *
 * Também apaga do R2 as fotos que nenhuma denúncia usa mais (denúncia ou conta excluída, foto
 * removida), porque o app não tem a chave do R2 para apagar na hora.
 *
 * Roda sozinho toda semana pelo GitHub Actions (.github/workflows/arquivar-fotos.yml) ou à mão:
 *   npm run arquivar-fotos -- --simular     mostra o que faria, sem mudar nada
 *   npm run arquivar-fotos                  arquiva e limpa
 *   Opções: --so-arquivar, --so-limpar, --forcar (passa da trava de segurança da limpeza)
 *
 * Variáveis (no GitHub: Settings > Secrets and variables > Actions; no computador: `.env.r2`,
 * ignorado pelo Git):
 *   SUPABASE_URL (ou VITE_SUPABASE_URL)   URL do projeto
 *   SUPABASE_SERVICE_ROLE_KEY             SEGREDO: acesso total ao banco. Nunca em VITE_* nem no Git.
 *   R2_ACCOUNT_ID                         id da conta Cloudflare
 *   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY SEGREDO: token de API do R2 (Object Read & Write, só este bucket)
 *   R2_BUCKET                             nome do bucket no R2
 *   R2_ENDPOINT                           opcional: outro endereço compatível com S3 (testes)
 *   ARQUIVAR_APOS_DIAS                    idade mínima da denúncia para arquivar a foto (padrão 30)
 *   ARQUIVAR_LIMITE                       máximo de fotos por execução (padrão 300)
 *
 * Precisa da migration 0033 aplicada.
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { AwsClient } from 'aws4fetch'
import { arquivarFotos, limparArquivo, PREFIXO_R2 } from './arquivar-fotos/nucleo.mjs'

const BUCKET_SUPABASE = 'denuncias-fotos'

function lerEnvArquivo(arquivo) {
  if (!fs.existsSync(arquivo)) return {}
  const env = {}
  for (const linha of fs.readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m && !linha.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const doArquivo = { ...lerEnvArquivo('.env'), ...lerEnvArquivo('.env.backup'), ...lerEnvArquivo('.env.r2') }
const env = (nome) => process.env[nome] || doArquivo[nome] || ''

const config = {
  supabaseUrl: (env('SUPABASE_URL') || env('VITE_SUPABASE_URL')).replace(/\/$/, ''),
  chaveServico: env('SUPABASE_SERVICE_ROLE_KEY'),
  conta: env('R2_ACCOUNT_ID'),
  chaveR2: env('R2_ACCESS_KEY_ID'),
  segredoR2: env('R2_SECRET_ACCESS_KEY'),
  bucketR2: env('R2_BUCKET'),
  dias: Number(env('ARQUIVAR_APOS_DIAS') || 30),
  limite: Number(env('ARQUIVAR_LIMITE') || 300),
}

const faltando = Object.entries({
  'SUPABASE_URL': config.supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: config.chaveServico,
  R2_ACCOUNT_ID: config.conta,
  R2_ACCESS_KEY_ID: config.chaveR2,
  R2_SECRET_ACCESS_KEY: config.segredoR2,
  R2_BUCKET: config.bucketR2,
})
  .filter(([, valor]) => !valor)
  .map(([nome]) => nome)
if (faltando.length) {
  console.error(`Faltam variáveis: ${faltando.join(', ')} (veja o topo de scripts/arquivar-fotos.mjs).`)
  process.exit(1)
}
if (!(config.dias >= 1) || !(config.limite >= 1)) {
  console.error('ARQUIVAR_APOS_DIAS e ARQUIVAR_LIMITE precisam ser números maiores que zero.')
  process.exit(1)
}

const args = new Set(process.argv.slice(2))
const simular = args.has('--simular')
const forcar = args.has('--forcar')

// ---------- Supabase (chave service_role: ignora as regras de acesso) ----------
const supabase = createClient(config.supabaseUrl, config.chaveServico, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function falhou(contexto, error) {
  // Só a mensagem do servidor; a chave nunca é impressa.
  return new Error(`${contexto}: ${error.message}`)
}

const db = {
  async listarParaArquivar(corte, limite) {
    const { data, error } = await supabase
      .from('denuncias')
      .select('id, foto_path')
      .not('foto_path', 'is', null)
      .not('foto_path', 'like', `${PREFIXO_R2}%`)
      .lt('created_at', corte)
      .order('created_at')
      .limit(limite)
    if (error) throw falhou('listar fotos para arquivar', error)
    return data
  },
  async marcarArquivada(id, path) {
    const { data, error } = await supabase
      .from('denuncias')
      .update({ foto_path: `${PREFIXO_R2}${path}` })
      .eq('id', id)
      .eq('foto_path', path)
      .select('id')
    if (error) throw falhou('marcar foto arquivada', error)
    return data.length === 1
  },
  async referenciasArquivadas() {
    const nomes = new Set()
    for (let inicio = 0; ; inicio += 1000) {
      const { data, error } = await supabase
        .from('denuncias')
        .select('foto_path')
        .like('foto_path', `${PREFIXO_R2}%`)
        .order('id')
        .range(inicio, inicio + 999)
      if (error) throw falhou('listar fotos arquivadas', error)
      for (const { foto_path } of data) nomes.add(foto_path.slice(PREFIXO_R2.length))
      if (data.length < 1000) return nomes
    }
  },
}

const origem = {
  async baixar(path) {
    const { data, error } = await supabase.storage.from(BUCKET_SUPABASE).download(path)
    if (error) throw falhou(`baixar ${path}`, error)
    return new Uint8Array(await data.arrayBuffer())
  },
  async apagar(paths) {
    const { error } = await supabase.storage.from(BUCKET_SUPABASE).remove(paths)
    if (error) throw falhou('apagar do Supabase', error)
  },
}

// ---------- Cloudflare R2 (API compatível com S3) ----------
const r2 = new AwsClient({
  accessKeyId: config.chaveR2,
  secretAccessKey: config.segredoR2,
  service: 's3',
  region: 'auto',
})
const endpointR2 = (env('R2_ENDPOINT') || `https://${config.conta}.r2.cloudflarestorage.com`).replace(/\/$/, '')
const baseR2 = `${endpointR2}/${config.bucketR2}`

async function pedirR2(caminho, init) {
  const resposta = await r2.fetch(`${baseR2}${caminho}`, init)
  if (!resposta.ok && resposta.status !== 404) {
    const texto = (await resposta.text()).slice(0, 200)
    throw new Error(`R2 HTTP ${resposta.status} em ${init?.method ?? 'GET'} ${caminho}: ${texto}`)
  }
  return resposta
}

const xml = (texto, tag) =>
  [...texto.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) =>
    m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  )

const destino = {
  async enviar(chave, bytes, tipo) {
    await pedirR2(`/${chave}`, {
      method: 'PUT',
      body: bytes,
      headers: { 'Content-Type': tipo, 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  },
  async tamanho(chave) {
    const resposta = await pedirR2(`/${chave}`, { method: 'HEAD' })
    if (resposta.status === 404) return null
    return Number(resposta.headers.get('content-length'))
  },
  async listar() {
    const arquivos = []
    let token = null
    do {
      const query = new URLSearchParams({ 'list-type': '2', 'max-keys': '1000' })
      if (token) query.set('continuation-token', token)
      const texto = await (await pedirR2(`?${query}`)).text()
      for (const bloco of xml(texto, 'Contents')) {
        arquivos.push({ chave: xml(bloco, 'Key')[0], modificadoEm: new Date(xml(bloco, 'LastModified')[0]) })
      }
      token = xml(texto, 'IsTruncated')[0] === 'true' ? xml(texto, 'NextContinuationToken')[0] : null
    } while (token)
    return arquivos
  },
  async apagar(chave) {
    await pedirR2(`/${chave}`, { method: 'DELETE' })
  },
}

// ---------- Execução ----------
let erro = false
if (simular) console.log('Modo simulação: nada será alterado.')

if (!args.has('--so-limpar')) {
  const r = await arquivarFotos({ db, origem, destino, dias: config.dias, limite: config.limite, simular })
  console.log(`Arquivamento: ${r.arquivadas} arquivada(s), ${r.ignoradas} ignorada(s), ${r.falhas} falha(s).`)
  if (r.falhas > 0) erro = true
}

if (!args.has('--so-arquivar')) {
  try {
    const r = await limparArquivo({ db, destino, simular, forcar })
    console.log(`Limpeza do R2: ${r.apagados} arquivo(s) apagado(s).`)
  } catch (e) {
    console.error(`Limpeza do R2 interrompida: ${e.message}`)
    erro = true
  }
}

process.exit(erro ? 1 : 0)
