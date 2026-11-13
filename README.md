# Deu o Prego!

App colaborativo para avisar sobre ônibus quebrados, atrasados ou lotados nas linhas de Teresina-PI. Feito para o **Fórum Piauiense de Luta pelo Transporte Público**.

**Site: https://deuoprego.com.br/**

> **Apresentação para não-desenvolvedores:** veja o `DOCUMENTO-EXECUTIVO.md` (visão geral do app,
> recursos, regras, privacidade, custos e rotina de operação, sem termos técnicos).

Qualquer pessoa vê o mapa, a lista e o painel de denúncias. Para registrar uma denúncia é preciso criar uma conta.

## O que o app faz

| Tela | Rota | Quem acessa |
| --- | --- | --- |
| Mapa com as denúncias do dia (tempo real), botão "Também vi" e denúncia rápida em 3 toques (linha favorita, problema, enviar; GPS automático) | `/` | todos |
| Lista de denúncias, com filtro Todos/Ônibus/Paradas e filtros por zona, linha, dia, status e tipo, botão "Também vi" (confirmar com conta) e "Compartilhar" (imagem para Instagram e WhatsApp) | `/denuncias` | todos |
| Painel público com a "Linha mais problemática da semana", totais, gráfico por dia, zonas e linhas mais citadas, e "Compartilhar ranking" (imagem), mais a seção "Paradas" (totais e problemas mais citados no período) | `/painel` | todos |
| Nova denúncia de **ônibus** (linha, tipo, descrição e local no mapa) ou de **parada** (referência opcional, tipo, foto e ponto no mapa; não há cadastro de paradas, vale o ponto marcado). Dá para enviar a primeira sem cadastro e criar a conta depois | `/nova` | todos |
| Perfil: nome, linhas que a pessoa pega, meus selos, minhas denúncias, feedback, baixar meus dados e excluir a conta | `/minhas` | quem tem conta |
| Entrar e Criar conta | `/login`, `/cadastro` | todos |
| Política de Privacidade e Termos de Uso | `/privacidade`, `/termos` | todos |
| Administração: painel, denúncias, linhas (CRUD), usuários e feedbacks | `/admin` | só admins |

O layout muda a partir de **1024 px**: no celular há uma barra de navegação embaixo; no desktop, um menu lateral, tabelas no admin e telas divididas em Entrar e Cadastro.

## Tecnologias

- React 19, TypeScript e Vite
- Tailwind CSS 4
- React Router 7
- Leaflet e react-leaflet, com mapa do OpenStreetMap
- Supabase: Auth, Postgres com RLS, Realtime e funções (RPC)
- Vitest e Testing Library nos testes; oxlint no lint
- Hospedagem na Vercel

## Começando

Requisitos: Node.js 20 ou mais novo e um projeto no [Supabase](https://supabase.com) (o plano gratuito basta).

```bash
npm install
cp .env.example .env   # preencha com os dados do seu projeto
npm run dev
```

O servidor sobe com `host: true`, então também abre pela rede local (ex.: `http://SEU_IP:5173`) para testar em um celular de verdade.

Variáveis do `.env` (em **Project Settings → API** no Supabase):

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checa os tipos e gera a versão de produção em `dist/` |
| `npm run preview` | serve a versão de produção localmente |
| `npm run lint` | roda o oxlint |
| `npm test` | roda a suíte de testes uma vez |
| `npm run test:watch` | testes em modo observador |

## Banco de dados (Supabase)

No **SQL Editor** do projeto, rode nesta ordem:

1. `supabase/migrations/0001_init.sql`: tabelas, RLS e realtime.
2. `supabase/seed.sql`: as 76 linhas da Setut, já divididas por zona.
3. As demais migrations, em ordem numérica (`0002` a `0013`):

| Migration | O que faz |
| --- | --- |
| `0002_numero_veiculo` | número do veículo na denúncia |
| `0003_admin` | papel de administrador e bloqueio de usuários |
| `0004_perfil_usuario` | dados do perfil e linhas que a pessoa pega |
| `0005_linhas_admin` | libera o CRUD de linhas só para admins |
| `0006_painel_resumo` | função que calcula o painel público no banco |
| `0007_perfil_nome` | guarda o nome no perfil |
| `0008_feedbacks` | tabela de feedbacks |
| `0009_autores_denuncias` | tira o autor das denúncias da leitura pública (LGPD) |
| `0010_direitos_titular` | funções de baixar os próprios dados e excluir a própria conta |
| `0011_aceites_documentos` | registra o aceite da política e dos termos |
| `0012_confirmacoes_denuncias` | botão "Também vi": confirmações privadas e total público por denúncia |
| `0013_denuncia_sem_cadastro` | denúncia sem cadastro: limite por hora para anônimos, e-mail do perfil acompanha a conta, "Também vi" só com conta |

**Denúncia sem cadastro (`0013`)**: ligue **Authentication → Sign In / Providers → Allow anonymous sign-ins** no Supabase. Sem isso, o envio sem conta falha e a pessoa vê o aviso para entrar. A pessoa aceita a Política e os Termos antes de enviar (o aceite é gravado), e depois cria a conta com e-mail e senha: o id continua o mesmo, então as denúncias ficam com ela. Se a confirmação de e-mail estiver ligada, a conta só vira "de verdade" depois da confirmação. Anônimos podem enviar até 5 denúncias por hora e não confirmam denúncias de outras pessoas. O Supabase já limita os logins anônimos por IP; um CAPTCHA ainda não está integrado (se ligar o CAPTCHA no painel, o app precisa enviar o token em `signInAnonymously`).

**Fotos nas denúncias (`0029`)**: a foto é opcional e fica no **Supabase Storage**, no bucket público `denuncias-fotos`, que a própria migration cria com limite de 512 KB por arquivo, só WebP/JPEG. Para caber no plano gratuito (1 GB de arquivos e 5 GB/mês de tráfego), o app reduz a foto no aparelho (lado maior até 1280 px, WebP, ~100–200 KB) e tira os metadados (EXIF/GPS). A foto só é baixada quando alguém toca em "Ver foto". O nome do arquivo é um UUID, sem o id de quem enviou, porque a autoria continua privada. Cada conta envia até 20 fotos por dia.

**Fila de aprovação das fotos (`0031`)**: a denúncia aparece na hora, mas a foto só fica pública depois que um admin aprova na aba **Admin → Fotos**. Enquanto isso, ela espera na tabela privada `fotos_pendentes`, e o autor vê "Foto em análise" no Perfil. Admins e contas com 3 ou mais denúncias confirmadas por outras pessoas publicam direto; contas anônimas e novas sempre passam pela fila. Recusar apaga o arquivo. O dono da denúncia e o admin podem **remover só a foto**, mantendo a denúncia. Um gatilho impede que alguém coloque uma foto na denúncia por update direto, sem passar pela fila. O Supabase não deixa apagar arquivos por SQL, então o app apaga a foto pela API do Storage ao excluir a denúncia (dono ou admin) e antes de excluir a conta. Uma foto pode ficar solta se a pessoa fechar o app entre o envio da foto e o da denúncia; acompanhe o uso em **Storage** no painel. O `npm run backup` não copia os arquivos do Storage.

Atenção: a `0009` muda a forma como o app lê as denúncias. Rode junto com o deploy do app; a versão antiga deixa de funcionar até a página ser recarregada.

Para virar admin, ajuste o papel da conta em `profiles` (`role = 'admin'`) pelo SQL Editor. Depois disso, admins promovem outros pela tela de Usuários.

### E-mail de confirmação

O template do e-mail de confirmação, no estilo do app, está em `supabase/templates/confirmacao-email.html`. No Supabase, vá em **Authentication → Emails → Confirm signup** e cole o conteúdo (assunto sugerido: `Confirme seu e-mail — Deu o Prego!`). A variável `{{ .ConfirmationURL }}` é preenchida pelo Supabase.

O e-mail padrão do Supabase tem limite baixo de envios por hora. Para uso real, configure um SMTP próprio em **Project Settings → Authentication → SMTP**.

## Arquivamento das fotos no Cloudflare R2

O Supabase gratuito tem 1 GB de arquivos. Para não chegar no limite sem perder fotos, o script `scripts/arquivar-fotos.mjs` move para o **Cloudflare R2** (plano gratuito com ~10 GB e sem cobrança de tráfego de saída; confira os valores atuais) as fotos de denúncias com mais de 30 dias. A denúncia passa a apontar para o R2 (`foto_path = 'r2:<arquivo>'`) e o app monta a URL de lá. O script roda toda segunda-feira pelo GitHub Actions (`.github/workflows/arquivar-fotos.yml`) e vem **desligado**.

Para cada foto, ele baixa do Supabase, envia ao R2, confere o tamanho da cópia, marca a denúncia e só então apaga do Supabase. Se algo falhar no meio, a foto continua no Supabase e o script tenta de novo na semana seguinte. Na mesma execução, apaga do R2 os arquivos que nenhuma denúncia usa mais (denúncia ou conta excluída, foto removida), porque o app não tem a chave do R2 para apagar na hora. Se a limpeza fosse apagar mais da metade do R2, ela para sem apagar nada.

### Como ligar

1. **Cloudflare:** crie a conta e ative o R2 (o Cloudflare pode pedir um cartão mesmo no plano gratuito). Crie um bucket, por exemplo `deuoprego-fotos`.
2. **Acesso público ao bucket:** em *Settings* do bucket, conecte um domínio próprio (ex.: `fotos.deuoprego.com.br`; o domínio precisa usar o DNS da Cloudflare) ou ative o endereço `r2.dev`, que tem limite de requisições e é indicado só para testes.
3. **Token do R2:** em *R2 → Manage API tokens*, crie um token com permissão **Object Read & Write** só para esse bucket. Guarde o *Access Key ID* e o *Secret Access Key*.
4. **Banco:** rode a migration `0036_fotos_arquivadas_r2.sql` no SQL Editor.
5. **App (Vercel), antes de ligar o script:** crie a variável `VITE_FOTOS_ARQUIVO_URL` com o endereço público do passo 2 e faça um novo deploy. Sem isso, as fotos arquivadas aparecem quebradas.
6. **GitHub:** em *Settings → Secrets and variables → Actions*, crie os **secrets** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `R2_BUCKET`. Opcionalmente, as **variables** `ARQUIVAR_APOS_DIAS` (padrão 30) e `ARQUIVAR_LIMITE` (fotos por execução, padrão 300).
7. **Teste:** em *Actions → Arquivar fotos no R2 → Run workflow*, rode com "simular" marcado e confira o log. Depois rode sem simular e abra uma foto antiga no app.
8. **Ligue o agendamento:** crie a **variable** `ARQUIVAR_FOTOS_ATIVO` com o valor `true`.
9. **Política de Privacidade:** inclua a Cloudflare na lista de serviços que guardam dados (seção "Com quem compartilhamos") e atualize `VERSAO_DOCUMENTOS`.

Para rodar no computador, coloque as mesmas variáveis num arquivo `.env.r2` (ignorado pelo Git) e use `npm run arquivar-fotos -- --simular` ou `npm run arquivar-fotos`.

Observações:
- Uma foto arquivada que perde a denúncia (exclusão de denúncia ou de conta) continua no R2 até a próxima execução, no máximo uma semana.
- O R2 também funciona como cópia de segurança das fotos antigas, que o `npm run backup` não cobre.
- Em repositórios públicos, o GitHub desliga agendamentos depois de 60 dias sem atividade no repositório; se isso acontecer, reative em *Actions*.

## Selos e ranking de linhas

Pequenos incentivos, sem competição entre pessoas:

- **Selos (só da própria pessoa, em Perfil):** "Voz ouvida" (uma denúncia sua foi confirmada por outra pessoa), "Fiscal da linha 603" (3 denúncias suas na mesma linha confirmadas por outras pessoas) e sequência de dias colaborando (3, 7 e 30 dias seguidos, enviando ou confirmando denúncias). O ganho vem de denúncias **confirmadas por outras pessoas** ("Também vi") e não de quantas a pessoa enviou, então mandar denúncia falsa não rende selo. Não existe ranking de pessoas. Os limites ficam em `src/lib/selos.ts` e os números vêm da função `meus_selos` (migration `0023`).
- **Linha mais problemática da semana (público, no Painel):** ranking de **linhas** dos últimos 7 dias, calculado por `ranking_linhas_semana`. Só entram linhas denunciadas por pelo menos 2 pessoas diferentes, para uma conta sozinha não fabricar o destaque. O banco devolve só totais; quem denunciou continua privado.

## Cartões compartilháveis

O botão **Compartilhar** (na lista, no cartão do mapa e no ranking do painel) gera uma imagem PNG 1080×1350 (formato 4:5 do feed do Instagram, que também serve para o WhatsApp) com a identidade visual do Fórum. A imagem é desenhada no próprio navegador, num `<canvas>`, sem enviar nada a servidor, e só leva dados que já são públicos (nunca a autoria). No celular abre o compartilhamento do sistema (Instagram, WhatsApp...); no computador baixa o arquivo. O desenho fica em `src/lib/cartaoCompartilhavel.ts`.

## Privacidade e LGPD

- O autor de uma denúncia não aparece para o público: a autoria fica numa tabela privada (`denuncia_autores`).
- No cadastro a pessoa aceita a Política de Privacidade e os Termos de Uso. O aceite fica registrado no servidor (`aceites_documentos`); contas antigas são perguntadas no app.
- No Perfil, cada pessoa baixa uma cópia dos seus dados e exclui a própria conta. O único administrador não pode se excluir.
- Os textos ficam em `src/pages/PoliticaPrivacidadePage.tsx` e `src/pages/TermosPage.tsx`. Os dados da organização (nome, natureza, e-mail de contato e, se quiser, endereço e encarregado) ficam em `src/lib/legal.ts`; campos opcionais vazios não aparecem.
- Ao mudar o texto de forma relevante, atualize `VERSAO_DOCUMENTOS` e `DATA_DOCUMENTOS` nesse arquivo: quem já aceitou é perguntado de novo.
- Peça a revisão dos textos a quem responde juridicamente pelo Fórum.

## Testes

Os testes (Vitest e React Testing Library) não dependem de um projeto Supabase real: o cliente é mockado por `src/test/supabaseMock.ts`. Ficam ao lado do código testado, em `*.test.ts(x)`.

Para simular o layout de desktop, use `simularDesktop()` e `restaurarLargura()` de `src/test/desktop.ts`. Sem `matchMedia` (como no jsdom), o app usa o layout de celular.

Se rodar os testes sem um `.env`, defina variáveis falsas para o cliente carregar:

```bash
VITE_SUPABASE_URL=https://f.supabase.co VITE_SUPABASE_ANON_KEY=f npm test
```

## Estrutura

```
src/
  pages/        telas (Mapa, Lista, Painel, Nova denúncia, Perfil, Admin, Login, Cadastro, textos legais)
  components/
    layout/     AppLayout, cabeçalho e barra de baixo (celular), menu lateral e tela dividida (desktop)
    map/        mapa Leaflet e seletor de local
    denuncia/   formulário, cartão e seletores de linha e tipo
    admin/      painel, linhas, feedbacks e tabelas do admin
    perfil/     dados do usuário, feedback e privacidade
    legal/      documentos, aceite e links legais
    ui/         peças comuns (botão, paginação, título, tutorial...)
  hooks/        autenticação, linhas, denúncias (com realtime), painel, perfil, useDesktop
  lib/          cliente Supabase, dados legais e cálculos do painel
  routes/       rotas protegidas (login e admin)
  test/         mock do Supabase e apoio aos testes
supabase/       migrations, seed e template de e-mail
public/brand/   artes da marca em SVG (logo, explosões, ônibus, catraca)
identidadevisual/  cores, fontes e artes originais da marca
```

## Identidade visual

Verde `#084400` e creme `#F3FCEE`, com estética de cartaz: bordas duras, sombras chapadas, cantos retos e títulos em itálico maiúsculo. As cores das zonas (Norte, Sul, Leste, Sudeste e Outras) ficam em `src/index.css`. As artes originais estão em `identidadevisual/`.

## Deploy

O app está no ar em https://deuoprego.com.br/. Ele é estático e roda na Vercel (`vercel.json` já faz o redirecionamento das rotas para o `index.html`). Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente do projeto na Vercel.

O plano Hobby da Vercel é só para uso não comercial; confira os limites do plano gratuito do Supabase (usuários ativos, banco, tráfego e conexões realtime) conforme o uso crescer.
