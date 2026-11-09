-- Admin: `nomes_por_usuario` aceita uma lista de ids e devolve só esses usuários.
--
-- Antes ela devolvia o nome de TODOS os usuários a cada chamada (aba Usuários e lista de denúncias do
-- admin), o que pesava no tráfego de saída (egress) do PostgREST. Agora o app pede só os ids que está
-- mostrando. Sem argumento (`ids` nulo) continua devolvendo todos, como antes. Continua devolvendo só o
-- nome (LGPD) e só ao admin.
drop function if exists nomes_por_usuario ();

create function nomes_por_usuario (ids uuid[] default null) returns table (user_id uuid, nome text) as $$
begin
  if not is_admin () then
    raise exception 'não autorizado';
  end if;
  return query
  select u.id, coalesce(nullif(d.nome, ''), nullif(u.raw_user_meta_data ->> 'nome', ''))
  from auth.users u
  left join perfis_detalhes d on d.user_id = u.id
  where (ids is null or u.id = any (ids))
    and coalesce(nullif(d.nome, ''), nullif(u.raw_user_meta_data ->> 'nome', '')) is not null;
end;
$$ language plpgsql stable security definer
set search_path = public;

revoke execute on function nomes_por_usuario (uuid[])
from
  public,
  anon;

grant execute on function nomes_por_usuario (uuid[]) to authenticated;
