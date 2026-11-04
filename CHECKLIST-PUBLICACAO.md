# Checklist de pré-publicação — Deu o Prego!

> **Para o Claude Code (VS Code):** você tem acesso ao banco. Execute este checklist e entregue, no fim, um
> relatório com **PASSOU / FALHOU / BLOQUEADO** por item e uma recomendação final **GO / NO-GO** para divulgar
> o app ao público. Leia o repositório (`README.md`, `supabase/migrations/`, `src/`) antes de começar.

## Regras de segurança (valem para tudo)

1. **Descubra primeiro qual banco é qual.** Pergunte ao usuário (ou leia `.env`) qual é o projeto Supabase de
   **teste** e qual é o de **produção**. Rode os testes de escrita **só no de teste**. Se só existir produção,
   faça apenas leituras (`select`) e testes dentro de `BEGIN; ... ROLLBACK;`, e **pare e pergunte** antes de
   qualquer escrita que não seja revertida.
2. **Nunca** rode `supabase db reset`, `drop`, `truncate` ou `delete` sem `where` em produção.
3. **Não imprima** chaves (`service_role`, senhas, JWTs) nos relatórios nem em commits.
4. Dados de teste usam e-mails `teste-*@exemplo.invalid`, e você os **apaga no final** (ou usa rollback).
5. Se um item não puder ser verificado por falta de acesso (painel do Supabase, Vercel), marque **BLOQUEADO**
   e diga exatamente o que o usuário precisa conferir à mão.

Contexto do que mudou recentemente (nada disso foi testado contra um Supabase de verdade ainda):
botão "Também vi" (`0012`), denúncia sem cadastro com login anônimo (`0013`), denúncia rápida em 3 toques e
animações. As migrations `0012` e `0013` podem **não** ter sido aplicadas em produção, e o Vercel pode estar
publicando a `main` automaticamente — então o site no ar pode estar quebrado agora.

---

## 1. Build e testes automáticos

- [ ] `npm ci`
- [ ] `npx tsc -b` sem erros
- [ ] `npx oxlint` sem **erros** (avisos antigos são aceitáveis)
- [ ] `VITE_SUPABASE_URL=http://x VITE_SUPABASE_ANON_KEY=x npx vitest run` → todos passam (esperado: 187)
- [ ] `npm run build` termina sem erro
- [ ] `vercel.json` tem o rewrite de SPA (rotas como `/nova` e `/denuncias` abrem direto, sem 404)

## 2. Migrations aplicadas (leitura)

- [ ] Liste as migrations aplicadas (`supabase migration list` ou a tabela `supabase_migrations.schema_migrations`)
      e confirme que **`0001` a `0023`** estão todas lá, na ordem.
- [ ] Confirme objetos criados:

```sql
-- tabelas
select to_regclass('public.denuncia_confirmacoes') is not null as tem_confirmacoes,
       to_regclass('public.denuncia_autores')      is not null as tem_autores,
       to_regclass('public.aceites_documentos')    is not null as tem_aceites;
-- coluna do contador
select column_name, data_type, column_default from information_schema.columns
 where table_schema='public' and table_name='denuncias' and column_name in ('confirmacoes','user_id');
-- esperado: confirmacoes integer default 0; NÃO pode existir user_id em denuncias
-- funções
select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and proname in
 ('criar_denuncia','alternar_confirmacao','sincronizar_email_perfil','atualizar_total_confirmacoes','proteger_total_confirmacoes','is_admin','is_banido','meus_selos','ranking_linhas_semana');
-- gatilhos
select tgname, tgrelid::regclass from pg_trigger where not tgisinternal and tgname in
 ('denuncia_confirmacoes_total','denuncias_proteger_confirmacoes','on_auth_user_email_updated','on_auth_user_created_aceite','on_auth_user_created');
-- a view "minhas_denuncias" expõe a coluna nova
select column_name from information_schema.columns
 where table_schema='public' and table_name='minhas_denuncias' and column_name='confirmacoes';
-- realtime inclui denuncias
select * from pg_publication_tables where pubname='supabase_realtime' and tablename='denuncias';
```

## 3. Segurança e privacidade (RLS) — o mais importante

Para cada caso, use uma transação com `ROLLBACK`. Padrão para agir como um usuário:

```sql
begin;
-- usuário de teste (adapte as colunas se o seu auth.users exigir mais campos)
insert into auth.users (id, aud, role, email, raw_user_meta_data, is_anonymous, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000000a1','authenticated','authenticated','teste-a@exemplo.invalid',
        '{"aceite_documentos":"2026-11-01"}', false, now(), now());
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub','00000000-0000-0000-0000-0000000000a1','role','authenticated','is_anonymous',false)::text, true);
-- ... chamadas de teste aqui ...
rollback;
```

Para simular visitante deslogado: `set local role anon;` (sem claims). Para sessão anônima: `is_anonymous: true`.

| # | Caso | Esperado |
|---|------|----------|
| 3.1 | Como `anon`: `select * from denuncias limit 1` | funciona, **sem** coluna de autor |
| 3.2 | Como `anon`: `select * from denuncia_autores` e `from denuncia_confirmacoes` | **negado** (permission denied / 0 linhas) |
| 3.3 | Como `authenticated` A: ler `denuncia_autores` e `denuncia_confirmacoes` | só as **próprias** linhas |
| 3.4 | Como `anon`: `insert into denuncias ...` direto | **negado** (só `criar_denuncia` cria) |
| 3.5 | Como `authenticated`: `update denuncias set confirmacoes = 999` na **própria** denúncia | o valor **não muda** (gatilho de proteção) |
| 3.6 | Como `authenticated` B: `update denuncias set status=...` na denúncia de A | 0 linhas afetadas |
| 3.7 | `aceites_documentos`, `feedbacks`, `perfis_detalhes`, `usuario_linhas` | cada pessoa só enxerga/edita os seus; `feedbacks` só admin lê |
| 3.8 | `profiles`: usuário comum tenta `update profiles set role='admin'` no próprio id | **negado** |
| 3.9 | `select proname, prosecdef from pg_proc ...` das funções `security definer` | todas com `set search_path = public` |
| 3.10 | `has_function_privilege('anon','criar_denuncia(uuid,text,text,text,double precision,double precision)','execute')` e o mesmo para `alternar_confirmacao(uuid)` | **false** |
| 3.12 | `meus_selos()`: `has_function_privilege('anon','meus_selos()','execute')` e como `authenticated` A e B | `anon` = **false**; cada pessoa recebe só os próprios números (nunca os de outra) |
| 3.13 | `ranking_linhas_semana(3)` como `anon` | funciona e devolve **só totais por linha** (sem `user_id`, sem lista de pessoas) |
| 3.11 | Rode `get_advisors` / o "Security Advisor" do Supabase (se disponível) | sem alertas de RLS desligado ou funções expostas |

## 4. Regras de negócio no banco

| # | Caso | Esperado |
|---|------|----------|
| 4.1 | Usuário comum: `select criar_denuncia(<linha>, 'quebrado', 'teste', null, -5.09, -42.8)` | devolve um uuid; cria linha em `denuncias` **e** em `denuncia_autores` |
| 4.2 | Sessão **anônima**: 5 chamadas seguidas de `criar_denuncia` | as 5 passam |
| 4.3 | Sessão anônima: a **6ª** chamada na mesma hora | erro `limite de denúncias por hora atingido` |
| 4.4 | Usuário comum: 6+ chamadas | todas passam (sem limite) |
| 4.5 | Usuário **banido** (`profiles.banido=true`): `criar_denuncia` e `alternar_confirmacao` | erro `usuário bloqueado` |
| 4.6 | `alternar_confirmacao` como **anônimo** | erro `crie uma conta para confirmar denúncias` |
| 4.7 | `alternar_confirmacao` na **própria** denúncia | erro `não é possível confirmar a própria denúncia` |
| 4.8 | `alternar_confirmacao` por B na denúncia de A | `confirmado=true`, `total=1`; chamar de novo → `confirmado=false`, `total=0` |
| 4.9 | Dois usuários confirmam a mesma denúncia | `denuncias.confirmacoes = 2` |
| 4.10 | `alternar_confirmacao` em denúncia `resolvido` (adicionar) | erro `denúncia já resolvida`; **remover** uma confirmação antiga continua permitido |
| 4.11 | Apagar a denúncia | confirmações e autoria somem em cascata (sem linhas órfãs) |
| 4.12 | `update auth.users set email='novo@exemplo.invalid' where id=<anônimo>` | `profiles.email` acompanha (gatilho `on_auth_user_email_updated`) |
| 4.13 | Inserir em `auth.users` com `raw_user_meta_data->>'aceite_documentos' = '2026-11-01'` (anônimo ou não) | aparece linha em `aceites_documentos` |
| 4.14 | `select * from minhas_denuncias` como A | só as dele, **com** a coluna `confirmacoes` |
| 4.16 | Selos: A tem 4 denúncias na linha X, 3 confirmadas por B/C; `meus_selos()` como A | `denuncias_confirmadas=3`, linha X com `confirmadas=3`; denúncia sem confirmação **não** conta |
| 4.17 | Sequência: denúncias/confirmações de A em dias seguidos (fuso `America/Fortaleza`), depois uma pausa | `sequencia_atual` e `melhor_sequencia` corretas; se o último dia foi há 2 dias ou mais, `sequencia_atual=0` |
| 4.18 | `ranking_linhas_semana`: linha com denúncias de **1 só pessoa** | **não** aparece (mínimo de 2 pessoas distintas); denúncias com mais de 7 dias não contam |
| 4.15 | `exportar_meus_dados()` e a exclusão da própria conta | funcionam também para quem veio de sessão anônima |

## 5. Autenticação (painel do Supabase / API)

- [ ] **Allow anonymous sign-ins** está **ligado**. Teste de verdade:
      `POST {SUPABASE_URL}/auth/v1/signup` com a anon key e corpo `{}` → deve devolver sessão com
      `user.is_anonymous = true` (apague esse usuário depois). Se o MCP/CLI não deixar ver o painel, marque BLOQUEADO.
- [ ] Converter anônimo em conta: com o token do anônimo, `PUT {SUPABASE_URL}/auth/v1/user` com
      `{"email":"teste-conv@exemplo.invalid","password":"senha-de-teste-123","data":{"nome":"Teste"}}`
      → verifique: o **mesmo `id`** continua; `is_anonymous` vira `false` (talvez só após confirmar o e-mail);
      as denúncias dele continuam em `minhas_denuncias`. **Anote o comportamento exato**: o app assume que
      e-mail e senha funcionam numa chamada só.
- [ ] Confirmação de e-mail: está ligada ou desligada? Descreva o fluxo que a pessoa vê em cada caso.
- [ ] **SMTP próprio** configurado (o padrão do Supabase tem limite baixo de e-mails por hora). Se não, **BLOQUEIA**
      a divulgação: muita gente criando conta ao mesmo tempo para de receber o e-mail.
- [ ] Template do e-mail de confirmação (`supabase/templates/confirmacao-email.html`) colado no painel; o remetente
      não é o genérico do Supabase.
- [ ] Rate limits de Auth revisados (logins anônimos por IP, e-mails por hora). Registre os valores.
- [ ] Existe pelo menos **um admin** (`profiles.role='admin'`) e o login dele funciona. Conferir `/admin`.
- [ ] CAPTCHA: está ligado? Se estiver, o app **não** envia o token (`signInAnonymously`) e o envio sem conta vai
      falhar → avise. Se não estiver, registre como risco aceito ou recomende ligar e implementar.

## 6. Fluxos no navegador (Playwright, contra o ambiente de **teste**)

Use viewport de celular **390×844** e também 1280×800. Capture screenshots de cada passo e **erros de console**.
Se o ambiente exigir, dê permissão e posição de GPS: `context.grantPermissions(['geolocation'])` e
`context.setGeolocation({latitude:-5.0892, longitude:-42.8019})`.

- [ ] **Visitante** abre `/`: o mapa carrega, aparece "Deu o prego? Denuncie agora, sem precisar de conta"; sem erro de console.
- [ ] **Denúncia sem cadastro:** `/nova` → escolher linha, descrição, marcar local → sem marcar o aceite o envio é
      **barrado**; marcando, envia; aparece "Denúncia enviada!" e o convite "Guarde suas denúncias".
- [ ] No banco: nasceu 1 usuário `is_anonymous=true`, 1 linha em `aceites_documentos` com a versão atual,
      1 denúncia + 1 autoria.
- [ ] **Criar a conta depois** (formulário do convite): passa; o `id` não muda; a denúncia continua em `/minhas`.
- [ ] Entrar com **conta já existente** estando em sessão anônima: registre o que acontece com as denúncias anônimas
      (esperado: ficam órfãs — apenas documente).
- [ ] **Denúncia rápida** (logado, com linhas favoritas no perfil): 3 toques (linha → problema → enviar), com GPS
      simulado, cria a denúncia e ela aparece no mapa **sem recarregar**. Sem permissão de GPS: aparece
      "Tentar de novo / marcar no mapa", e o link abre `/nova` com linha e tipo preenchidos.
- [ ] Fechar o cartão de denúncia rápida (botão ×) e navegar: ele não volta até recarregar a página.
- [ ] **"Também vi"** com dois contextos de navegador (duas contas): A cria, B confirma → o número sobe **nos dois**
      em tempo real; B desfaz → volta. A confirmar a própria → mensagem de aviso. Anônimo → vai para o login.
- [ ] **Tempo real:** uma denúncia criada num contexto aparece na `/denuncias` e no mapa do outro sem recarregar.
- [ ] `/denuncias`: filtros (zona, linha, dia, status, tipo), paginação no desktop e botão "Também vi" funcionam.
- [ ] `/painel` carrega os números (função `painel_resumo`) e o bloco "Linha mais problemática da semana" (função `ranking_linhas_semana`) sem erro; sem 2 pessoas diferentes na mesma linha, aparece a mensagem explicando a regra.
- [ ] `/minhas` mostra "Meus selos" (só da própria pessoa) e a sequência atual; confirmar com duas contas que "Voz ouvida" aparece só depois que **outra** pessoa confirma uma denúncia.
- [ ] `/minhas`: marcar resolvido, reabrir, excluir denúncia, baixar meus dados, excluir conta (use conta de teste).
- [ ] `/admin` com o admin: painel, denúncias, linhas (CRUD), usuários (contas sem e-mail aparecem em branco — anotar), feedbacks.
- [ ] **Animações:** com `page.emulateMedia({ reducedMotion: 'reduce' })` nada anima/desloca e tudo continua usável.
- [ ] Layout no celular: o bloco de denúncia rápida sobre o mapa não cobre os filtros de zona nem o cartão da
      denúncia selecionada de forma que impeça o uso; sem rolagem horizontal; alvos de toque ≥ 44 px.
- [ ] Nenhum erro 4xx/5xx inesperado nas requisições ao Supabase (liste os que houver).

## 7. Desempenho e custo

- [ ] Conte as linhas de `denuncias`. A lista busca até 1000 por página nos últimos 30 dias; estime o tráfego de
      saída do Supabase com, por exemplo, 500 pessoas abrindo o app por dia.
- [ ] Índices: `denuncias(created_at)`, `denuncias(linha_id)`, `denuncia_autores(user_id)`,
      `denuncia_confirmacoes(user_id)` existem. `explain` das consultas principais sem varredura enorme.
- [ ] Plano do Supabase (limites de banco, e-mails, usuários ativos mensais, conexões realtime) comporta o público esperado.
- [ ] **Backups** ligados (e PITR, se o plano permitir). Registre quando foi o último.

## 8. Jurídico, conteúdo e operação

- [ ] `src/lib/legal.ts`: nome da organização, e-mail de contato e demais campos estão **preenchidos de verdade**
      (sem placeholders).
- [ ] A Política de Privacidade (`src/pages/PoliticaPrivacidadePage.tsx`) menciona: uso **sem cadastro** (sessão
      anônima), as **confirmações do "Também vi"** e o que acontece com denúncias de quem nunca criou conta.
      **Hoje não menciona** → deixe como pendência para o responsável jurídico do Fórum.
- [ ] `VERSAO_DOCUMENTOS` só deve ser atualizada **junto** com a revisão do texto (para as contas antigas
      aceitarem de novo). Não altere sem pedir ao usuário.
- [ ] Há um responsável e uma rotina para **moderar** (marcar spam, banir usuário). Documente como banir (`profiles.banido`).
- [ ] Variáveis de ambiente no Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) apontam para **produção**,
      e o preview do Vercel não aponta para produção por engano. A chave `service_role` **não** está em nenhuma
      variável `VITE_*` nem no repositório (`git grep -i service_role`).
- [ ] Domínio/HTTPS, metatags e imagem de compartilhamento (`index.html`) corretos para divulgar nas redes.

## 9. Relatório final (formato obrigatório)

1. Tabela por seção: `item | resultado (PASSOU/FALHOU/BLOQUEADO) | evidência (consulta, saída resumida, screenshot)`.
2. **Bloqueadores** (impedem divulgar): liste cada um com a correção sugerida.
3. **Riscos aceitáveis** (podem ir ao ar com monitoramento): liste.
4. **O que o usuário precisa fazer à mão** (painel do Supabase, Vercel, jurídico).
5. **Veredito: GO ou NO-GO**, com uma frase de justificativa.
6. Confirme que os dados de teste foram **removidos** (liste o que apagou) e que nada em produção foi alterado.

**Critérios para GO:** seções 1–5 sem nenhum FALHOU; todos os casos 3.x e 4.x passam; os fluxos principais da seção 6
(denúncia sem cadastro → criar conta, denúncia rápida, "Também vi", tempo real) funcionam no celular; SMTP próprio
configurado; backups ligados; contato legal preenchido. Qualquer FALHOU em RLS/privacidade (3.x) é **NO-GO** automático.
