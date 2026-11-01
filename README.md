# Deu o Prego!

App colaborativo para avisar sobre ônibus quebrados, atrasados ou lotados nas linhas de Teresina-PI. Feito para o **Fórum Piauiense de Luta pelo Transporte Público**.

Qualquer pessoa vê o mapa, a lista e o painel de denúncias. Para registrar uma denúncia é preciso criar uma conta.

## O que o app faz

| Tela | Rota | Quem acessa |
| --- | --- | --- |
| Mapa com as denúncias do dia (tempo real) | `/` | todos |
| Lista de denúncias, com filtros por zona, linha, dia, status e tipo | `/denuncias` | todos |
| Painel público com totais, gráfico por dia, zonas e linhas mais citadas | `/painel` | todos |
| Nova denúncia (linha, tipo, descrição e local no mapa) | `/nova` | quem tem conta |
| Perfil: nome, linhas que a pessoa pega, minhas denúncias, feedback, baixar meus dados e excluir a conta | `/minhas` | quem tem conta |
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
3. As demais migrations, em ordem numérica (`0002` a `0011`):

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

Atenção: a `0009` muda a forma como o app lê as denúncias. Rode junto com o deploy do app; a versão antiga deixa de funcionar até a página ser recarregada.

Para virar admin, ajuste o papel da conta em `profiles` (`role = 'admin'`) pelo SQL Editor. Depois disso, admins promovem outros pela tela de Usuários.

### E-mail de confirmação

O template do e-mail de confirmação, no estilo do app, está em `supabase/templates/confirmacao-email.html`. No Supabase, vá em **Authentication → Emails → Confirm signup** e cole o conteúdo (assunto sugerido: `Confirme seu e-mail — Deu o Prego!`). A variável `{{ .ConfirmationURL }}` é preenchida pelo Supabase.

O e-mail padrão do Supabase tem limite baixo de envios por hora. Para uso real, configure um SMTP próprio em **Project Settings → Authentication → SMTP**.

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

O app é estático e roda na Vercel (`vercel.json` já faz o redirecionamento das rotas para o `index.html`). Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente do projeto na Vercel.

O plano Hobby da Vercel é só para uso não comercial; confira os limites do plano gratuito do Supabase (usuários ativos, banco, tráfego e conexões realtime) conforme o uso crescer.
