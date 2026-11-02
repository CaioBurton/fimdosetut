-- Admin: nome de cada usuário (coluna "Nome" da tabela de usuários).
--
-- `perfis_detalhes` só pode ser lida pelo próprio dono (0004). Em vez de abrir a tabela inteira ao
-- admin (ela também guarda bairro, trabalho e estudo), esta função devolve só o nome, e só para
-- quem é admin. Minimização de dados (LGPD): o admin vê o que precisa para moderar.
create function nomes_por_usuario () returns table (user_id uuid, nome text) as $$
begin
  if not is_admin () then
    raise exception 'não autorizado';
  end if;
  return query
  select d.user_id, d.nome
  from perfis_detalhes d
  where d.nome <> '';
end;
$$ language plpgsql stable security definer
set search_path = public;

revoke execute on function nomes_por_usuario ()
from
  public,
  anon;

grant execute on function nomes_por_usuario () to authenticated;
