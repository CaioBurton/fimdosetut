# Deu o Prego!

App colaborativo mobile-first para avisar sobre ônibus quebrados (e outros problemas) nas linhas de Teresina-PI. Qualquer pessoa pode ver o mapa de denúncias; cadastrar uma denúncia exige login.

## Configuração do Supabase

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No SQL Editor do projeto, rode nesta ordem:
   - `supabase/migrations/0001_init.sql` (tabelas, RLS e realtime)
   - `supabase/seed.sql` (as 76 linhas da Setut, já divididas por zona)
3. Em **Project Settings → API**, copie a `Project URL` e a `anon public key`.
4. Copie `.env.example` para `.env` e preencha:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

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
