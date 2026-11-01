-- Denúncia sem cadastro: a pessoa envia a primeira denúncia como usuária anônima do Supabase Auth
-- (signInAnonymously) e cria a conta depois, mantendo as denúncias (updateUser com e-mail e senha
-- mantém o mesmo id). Requer ligar "Allow anonymous sign-ins" em Authentication → Sign In / Providers.
--
-- O aceite da Política e dos Termos continua registrado: o app manda `aceite_documentos` nos
-- metadados do login anônimo e o gatilho da 0011 grava em `aceites_documentos`.

-- 1. Quando o e-mail da conta muda (anônima que vira conta de verdade), o perfil acompanha.
create function sincronizar_email_perfil () returns trigger as $$
begin
  update profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$ language plpgsql security definer
set search_path = public;

create trigger on_auth_user_email_updated
after
update of email on auth.users for each row when (old.email is distinct from new.email)
execute function sincronizar_email_perfil ();

-- 2. Anônimos têm limite de denúncias por hora (contas com cadastro seguem sem limite).
create or replace function criar_denuncia (
  p_linha_id uuid,
  p_tipo text,
  p_descricao text,
  p_numero_veiculo text,
  p_latitude double precision,
  p_longitude double precision
) returns uuid as $$
declare
  nova uuid;
begin
  if auth.uid () is null then
    raise exception 'não autenticado';
  end if;
  if is_banido () then
    raise exception 'usuário bloqueado';
  end if;

  if coalesce((auth.jwt () ->> 'is_anonymous')::boolean, false)
    and (
      select count(*)
      from denuncia_autores a
      join denuncias d on d.id = a.denuncia_id
      where a.user_id = auth.uid ()
        and d.created_at > now() - interval '1 hour'
    ) >= 5 then
    raise exception 'limite de denúncias por hora atingido';
  end if;

  insert into denuncias (linha_id, tipo, descricao, numero_veiculo, latitude, longitude)
  values (p_linha_id, p_tipo, p_descricao, p_numero_veiculo, p_latitude, p_longitude)
  returning id into nova;

  insert into denuncia_autores (denuncia_id, user_id) values (nova, auth.uid ());

  return nova;
end;
$$ language plpgsql security definer
set search_path = public;

-- 3. "Também vi" só para quem tem conta (evita inflar o contador com contas anônimas).
create or replace function alternar_confirmacao (p_denuncia_id uuid) returns table (confirmado boolean, total integer) as $$
declare
  v_confirmado boolean;
  v_status text;
begin
  if auth.uid () is null then
    raise exception 'não autenticado';
  end if;
  if coalesce((auth.jwt () ->> 'is_anonymous')::boolean, false) then
    raise exception 'crie uma conta para confirmar denúncias';
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
