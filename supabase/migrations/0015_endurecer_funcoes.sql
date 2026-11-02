-- Endurece funções apontadas pelo Security Advisor do Supabase (lints 0011, 0028 e 0029).
--
-- 1. `search_path` fixo nas funções que ainda não tinham (evita que um schema criado por outra
--    pessoa "sombreie" tabelas e funções usadas por elas).
-- 2. Funções de gatilho (trigger) não precisam estar expostas na API (`/rest/v1/rpc/...`). O
--    privilégio EXECUTE de uma função de gatilho só é checado ao criar o gatilho, então tirá-lo de
--    anon/authenticated não muda o funcionamento dos gatilhos existentes.
--
-- Fica como está, de propósito:
-- - `criar_denuncia`, `alternar_confirmacao`, `excluir_minha_conta`, `exportar_meus_dados`
--   e `admin_excluir_usuario` para `authenticated`: são a API do app e
--   cada uma checa auth.uid()/is_admin() por dentro.
-- - `is_admin()` e `is_banido()` para anon/authenticated: são chamadas pelas policies de RLS, que
--   rodam com os privilégios de quem consulta; só respondem sobre o próprio usuário.

alter function set_updated_at () set search_path = public;

alter function denuncias_por_usuario () set search_path = public;

alter function proteger_total_confirmacoes () set search_path = public;

revoke execute on function handle_new_user ()
from
  public,
  anon,
  authenticated;

revoke execute on function atualizar_total_confirmacoes ()
from
  public,
  anon,
  authenticated;

revoke execute on function sincronizar_email_perfil ()
from
  public,
  anon,
  authenticated;

revoke execute on function registrar_aceite_cadastro ()
from
  public,
  anon,
  authenticated;
