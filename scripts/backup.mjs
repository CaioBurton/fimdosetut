#!/usr/bin/env node
/**
 * Backup lógico do Supabase (para o plano gratuito, que não tem backup automático).
 *
 * Salva, em `backups/AAAA-MM-DD_HHMM/`, uma cópia em JSON de todas as tabelas do schema `public`
 * e da lista de contas (Auth). Só faz leituras (GET): nada no banco é alterado.
 *
 * Uso:
 *   1. Pegue a chave `service_role` em Supabase > Project Settings > API (é um SEGREDO: dá acesso
 *      total ao banco; nunca coloque em variável `VITE_*`, no repositório ou em chat).
 *   2. Defina-a só no seu computador, de um destes jeitos:
 *        - PowerShell:  $env:SUPABASE_SERVICE_ROLE_KEY = "..." ; npm run backup
 *        - ou crie o arquivo `.env.backup` (ignorado pelo Git) com a linha
 *          SUPABASE_SERVICE_ROLE_KEY=...
 *   3. `npm run backup`
 *
 * A URL do projeto vem de SUPABASE_URL ou de VITE_SUPABASE_URL (do `.env`).
 *
 * ATENÇÃO (LGPD): a pasta `backups/` tem dados pessoais (e-mails, denúncias, autoria). Ela está no
 * `.gitignore`; guarde as cópias em lugar privado e apague as antigas.
 */
import fs from 'node:fs'
import path from 'node:path'

const PAGINA = 1000
// Views não são dados próprios (e `minhas_denuncias` depende do usuário logado).
const IGNORAR = new Set(['minhas_denuncias'])

function lerEnvArquivo(arquivo) {
  if (!fs.existsSync(arquivo)) return {}
  const env = {}
  for (const linha of fs.readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m && !linha.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const doArquivo = { ...lerEnvArquivo('.env'), ...lerEnvArquivo('.env.backup') }
const URL_BASE = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || doArquivo.SUPABASE_URL || doArquivo.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const CHAVE = process.env.SUPABASE_SERVICE_ROLE_KEY || doArquivo.SUPABASE_SERVICE_ROLE_KEY || ''

if (!URL_BASE) {
  console.error('Falta a URL do projeto (SUPABASE_URL ou VITE_SUPABASE_URL no .env).')
  process.exit(1)
}
if (!CHAVE) {
  console.error('Falta SUPABASE_SERVICE_ROLE_KEY (veja as instruções no topo de scripts/backup.mjs).')
  process.exit(1)
}

const cabecalhos = { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` }

async function pegar(caminho, extra = {}) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, { headers: { ...cabecalhos, ...extra } })
  if (!resposta.ok) {
    // Nunca imprime a chave; só o status e o começo da mensagem do servidor.
    const texto = (await resposta.text()).slice(0, 200)
    throw new Error(`HTTP ${resposta.status} em ${caminho}: ${texto}`)
  }
  return resposta
}

/** Descobre as tabelas e as colunas da chave primária (para paginar numa ordem estável). */
async function descobrirTabelas() {
  const esquema = await (await pegar('/rest/v1/', { Accept: 'application/openapi+json' })).json()
  const tabelas = []
  for (const [nome, def] of Object.entries(esquema.definitions ?? {})) {
    if (IGNORAR.has(nome)) continue
    const chave = Object.entries(def.properties ?? {})
      .filter(([, p]) => (p.description ?? '').includes('Primary Key'))
      .map(([coluna]) => coluna)
    tabelas.push({ nome, chave })
  }
  return tabelas.sort((a, b) => a.nome.localeCompare(b.nome))
}

async function baixarTabela({ nome, chave }) {
  const linhas = []
  let total = null
  const ordem = chave.length ? `&order=${chave.join(',')}` : ''
  for (let inicio = 0; ; inicio += PAGINA) {
    const resposta = await pegar(`/rest/v1/${nome}?select=*${ordem}`, {
      Range: `${inicio}-${inicio + PAGINA - 1}`,
      'Range-Unit': 'items',
      Prefer: 'count=exact',
    })
    const pagina = await resposta.json()
    if (total === null) total = Number((resposta.headers.get('content-range') ?? '').split('/')[1])
    linhas.push(...pagina)
    if (pagina.length < PAGINA) break
  }
  if (Number.isFinite(total) && total !== linhas.length) {
    throw new Error(`${nome}: o servidor informou ${total} linhas, mas baixei ${linhas.length}.`)
  }
  return linhas
}

/** Contas do Auth (sem senhas: o Supabase nunca as entrega, só o hash fica no banco). */
async function baixarContas() {
  const contas = []
  for (let pagina = 1; ; pagina++) {
    const corpo = await (await pegar(`/auth/v1/admin/users?page=${pagina}&per_page=${PAGINA}`)).json()
    const usuarios = corpo.users ?? []
    contas.push(...usuarios)
    if (usuarios.length < PAGINA) break
  }
  return contas
}

const agora = new Date()
const pad = (n) => String(n).padStart(2, '0')
const carimbo = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}_${pad(agora.getHours())}${pad(agora.getMinutes())}`
const pasta = path.join('backups', carimbo)

function salvar(nome, dados) {
  fs.writeFileSync(path.join(pasta, `${nome}.json`), JSON.stringify(dados, null, 2), 'utf8')
}

async function main() {
  const tabelas = await descobrirTabelas()
  if (tabelas.length === 0) throw new Error('Nenhuma tabela encontrada: a chave é mesmo a service_role?')
  fs.mkdirSync(pasta, { recursive: true })

  const resumo = {}
  const falhas = []
  for (const tabela of tabelas) {
    try {
      const linhas = await baixarTabela(tabela)
      salvar(tabela.nome, linhas)
      resumo[tabela.nome] = linhas.length
      console.log(`  ${tabela.nome}: ${linhas.length} linhas`)
    } catch (erro) {
      falhas.push(`${tabela.nome}: ${erro.message}`)
    }
  }

  try {
    const contas = await baixarContas()
    salvar('auth_users', contas)
    resumo.auth_users = contas.length
    console.log(`  auth_users: ${contas.length} contas`)
  } catch (erro) {
    falhas.push(`auth_users: ${erro.message}`)
  }

  salvar('_manifest', { criado_em: agora.toISOString(), projeto: new URL(URL_BASE).host, linhas_por_tabela: resumo, falhas })

  if (falhas.length) {
    console.error('\nBackup INCOMPLETO. Falhas:')
    for (const f of falhas) console.error(`  - ${f}`)
    process.exit(1)
  }
  console.log(`\nBackup completo em ${pasta}`)
}

main().catch((erro) => {
  console.error(`Backup falhou: ${erro.message}`)
  process.exit(1)
})
