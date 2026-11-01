# Deu o Prego!

App colaborativo mobile-first para avisar sobre ônibus quebrados (e outros problemas) nas linhas de Teresina-PI. Qualquer pessoa pode ver o mapa de denúncias; cadastrar uma denúncia exige login.

## Configuração do Supabase

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No SQL Editor do projeto, rode nesta ordem:
   - `supabase/migrations/0001_init.sql` (tabelas, RLS e realtime)
   - `supabase/seed.sql` (as 76 linhas da Setut, já divididas por zona)
   - as migrations seguintes (`0002` a `0010`), em ordem — a `0005_linhas_admin.sql` libera o CRUD de linhas só para admins, a `0006_painel_resumo.sql` cria a função do painel público, a `0007_perfil_nome.sql` guarda o nome no perfil, a `0008_feedbacks.sql` cria a tabela de feedbacks e a `0009_autores_denuncias.sql` tira o autor das denúncias da leitura pública (rode junto com o deploy do app: o app antigo deixa de funcionar até recarregar) e a `0010_direitos_titular.sql` cria as funções de baixar os próprios dados e excluir a própria conta
3. Em **Project Settings → API**, copie a `Project URL` e a `anon public key`.
4. Copie `.env.example` para `.env` e preencha:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

### E-mail de confirmação

O template do e-mail de confirmação de cadastro, no estilo do app, está em `supabase/templates/confirmacao-email.html`. Para usar: no painel do Supabase, vá em **Authentication → Emails → Confirm signup** e cole o conteúdo do arquivo (assunto sugerido: `Confirme seu e-mail — Deu o Prego!`). A variável `{{ .ConfirmationURL }}` é preenchida pelo Supabase.

### Política de Privacidade e Termos de Uso

Os textos ficam em `src/pages/PoliticaPrivacidadePage.tsx` (rota `/privacidade`) e `src/pages/TermosPage.tsx` (rota `/termos`). Os dados da organização (nome, CNPJ, endereço, e-mail de contato, encarregado) ficam em `src/lib/legal.ts`: **troque os campos `[PREENCHER]` antes de divulgar o app** e peça a revisão de quem responde juridicamente pelo Fórum. Ao mudar o texto de forma relevante, atualize `VERSAO_DOCUMENTOS` e `DATA_DOCUMENTOS`: a versão aceita é gravada na conta no cadastro.

## Rodando localmente

```bash
npm install
npm run dev
```

O servidor sobe com `host: true`, então também fica acessível pela rede local (ex: `http://SEU_IP:5173`) para testar em um celular de verdade na mesma rede.

## Testes

```bash
npm test          # roda a suíte uma vez
npm run test:watch  # modo observador
```

Os testes (Vitest + React Testing Library) não dependem de um projeto Supabase real — o cliente Supabase é mockado em cada teste via `src/test/supabaseMock.ts`. Ficam ao lado do código testado (`*.test.ts(x)`):

- Unitários: `markerIcon`, `LinhaSelect`, `DenunciaCard`, `ProtectedRoute`
- Integração (vários componentes/hooks reais + Supabase mockado): `useLinhas`, `useDenuncias` (incluindo eventos realtime), `LoginPage`, `CadastroPage`, `DenunciaForm`, `MinhasDenunciasPage`

## Estrutura

- `src/pages` — telas (Mapa, Lista, Nova Denúncia, Perfil (dados do usuário, linhas que pega e minhas denúncias), Login, Cadastro)
- `src/components/map` — mapa Leaflet/OpenStreetMap e seletor de localização
- `src/hooks` — autenticação (`useAuth`), linhas (`useLinhas`) e denúncias com realtime (`useDenuncias`)
- `supabase/` — migration e seed do banco
- `identidadevisual/` — cores, fontes e artes da marca usadas no app
