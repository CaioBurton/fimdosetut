-- "Também vi" sem cadastro: contas anônimas (signInAnonymously) passam a poder confirmar denúncias.
-- Para não inflar o contador, anônimos têm limite de novas confirmações por hora (contas com
-- cadastro seguem sem limite). Desfazer a confirmação nunca é limitado.
create or replace function alternar_confirmacao (p_denuncia_id uuid) returns table (confirmado boolean, total integer) as $$
declare
  v_confirmado boolean;
  v_status text;
begin
  if auth.uid () is null then
    raise exception 'não autenticado';
  end if;
  if is_banido () then
    raise exception 'usuário bloqueado';
  end if;

  select d.status into v_status from denuncias d where d.id = p_denuncia_id;
  if not found then
    raise exception 'denúncia não encontrada';
  end if;

  if exists (
    select 1
    from denuncia_autores a
    where a.denuncia_id = p_denuncia_id
      and a.user_id = auth.uid ()
  ) then
    raise exception 'não é possível confirmar a própria denúncia';
  end if;

  delete from denuncia_confirmacoes
  where denuncia_id = p_denuncia_id
    and user_id = auth.uid ();

  if found then
    v_confirmado := false;
  else
    if v_status = 'resolvido' then
      raise exception 'denúncia já resolvida';
    end if;

    if coalesce((auth.jwt () ->> 'is_anonymous')::boolean, false)
      and (
        select count(*)
        from denuncia_confirmacoes c
        where c.user_id = auth.uid ()
          and c.created_at > now() - interval '1 hour'
      ) >= 20 then
      raise exception 'limite de confirmações por hora atingido';
    end if;

    insert into denuncia_confirmacoes (denuncia_id, user_id)
    values (p_denuncia_id, auth.uid ())
    on conflict do nothing;
    v_confirmado := true;
  end if;

  return query
  select v_confirmado, d.confirmacoes from denuncias d where d.id = p_denuncia_id;
end;
$$ language plpgsql security definer
set search_path = public;
