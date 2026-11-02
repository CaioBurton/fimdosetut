-- Admin: o nome digitado no cadastro também aparece na tabela de usuários.
--
-- O cadastro guarda o nome só nos metadados da conta (`raw_user_meta_data ->> 'nome'`); a tabela
-- `perfis_detalhes` só ganha o nome quando a pessoa edita o perfil. A função passa a usar o nome
-- do perfil quando houver e, senão, o do cadastro. Continua devolvendo só o nome (LGPD) e só ao admin.
create or replace function nomes_por_usuario () returns table (user_id uuid, nome text) as $$
begin
  if not is_admin () then
    raise exception 'não autorizado';
  end if;
  return query
  select u.id, coalesce(nullif(d.nome, ''), nullif(u.raw_user_meta_data ->> 'nome', ''))
  from auth.users u
  left join perfis_detalhes d on d.user_id = u.id
  where coalesce(nullif(d.nome, ''), nullif(u.raw_user_meta_data ->> 'nome', '')) is not null;
end;
$$ language plpgsql stable security definer
set search_path = public;
