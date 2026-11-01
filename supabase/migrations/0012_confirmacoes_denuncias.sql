-- "Também vi": quem pega a mesma linha confirma uma denúncia que outra pessoa fez.
--
-- Mesmo princípio da 0009 (LGPD): quem confirmou fica numa tabela privada, que só a própria
-- pessoa lê. O público só enxerga o TOTAL, guardado em `denuncias.confirmacoes` (assim ele
-- também chega em tempo real pelo UPDATE da denúncia).

-- 1. Quem confirmou o quê (privado).
create table denuncia_confirmacoes (
  denuncia_id uuid not null references denuncias (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (denuncia_id, user_id)
);

create index denuncia_confirmacoes_user_id_idx on denuncia_confirmacoes (user_id);

alter table denuncia_confirmacoes enable row level security;

revoke all on denuncia_confirmacoes
from
  anon;

grant select on denuncia_confirmacoes to authenticated;

-- Só leitura das próprias confirmações. A gravação é feita pela função `alternar_confirmacao`.
create policy "denuncia_confirmacoes: dono" on denuncia_confirmacoes for select using (auth.uid () = user_id);

-- 2. Total público, mantido por gatilho.
alter table denuncias
add column confirmacoes integer not null default 0;

create function atualizar_total_confirmacoes () returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update denuncias set confirmacoes = confirmacoes + 1 where id = new.denuncia_id;
  else
    update denuncias set confirmacoes = greatest(confirmacoes - 1, 0) where id = old.denuncia_id;
  end if;
  return null;
end;
$$ language plpgsql security definer
set search_path = public;

create trigger denuncia_confirmacoes_total
after insert or delete on denuncia_confirmacoes for each row
execute function atualizar_total_confirmacoes ();

-- O total só muda pelo gatilho acima (profundidade > 1): um UPDATE direto do dono da denúncia
-- não consegue inflar o próprio número.
create function proteger_total_confirmacoes () returns trigger as $$
begin
  if pg_trigger_depth () = 1 then
    new.confirmacoes = old.confirmacoes;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger denuncias_proteger_confirmacoes before update on denuncias for each row
execute function proteger_total_confirmacoes ();

-- 3. Confirmar / desfazer. Devolve se a pessoa agora confirma a denúncia e o novo total.
create function alternar_confirmacao (p_denuncia_id uuid) returns table (confirmado boolean, total integer) as $$
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

revoke all on function alternar_confirmacao (uuid)
from
  public,
  anon;

grant
execute on function alternar_confirmacao (uuid) to authenticated;

-- 4. A visão "minhas denúncias" passa a incluir a nova coluna (o `d.*` é expandido na criação).
create or replace view minhas_denuncias
with
  (security_invoker = true) as
select d.*
from denuncias d
join denuncia_autores a on a.denuncia_id = d.id
where a.user_id = auth.uid ();
