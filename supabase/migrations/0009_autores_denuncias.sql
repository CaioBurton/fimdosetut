-- LGPD: tira da leitura pública o `user_id` de quem fez a denúncia.
--
-- Antes, `denuncias.user_id` era lido por qualquer visitante (leitura pública), o que permitia
-- juntar todas as denúncias de uma mesma pessoa e ver por onde ela anda. Agora a autoria fica
-- numa tabela privada (`denuncia_autores`), que só o próprio autor e o admin leem. A tabela
-- `denuncias` (e o tempo real dela) não tem mais nenhum dado de quem enviou.
--
-- ATENÇÃO: rode esta migration junto com o deploy do app desta versão. O app antigo lê e grava
-- `denuncias.user_id` e deixa de funcionar até a página ser recarregada.

-- 1. Autoria em tabela privada.
create table denuncia_autores (
  denuncia_id uuid primary key references denuncias (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade
);

create index denuncia_autores_user_id_idx on denuncia_autores (user_id);

alter table denuncia_autores enable row level security;

revoke all on denuncia_autores
from
  anon;

grant select on denuncia_autores to authenticated;

-- Só leitura, e só do dono ou do admin. Não há policy de escrita: a gravação é feita pela
-- função `criar_denuncia` e a remoção acontece em cascata quando a denúncia ou a conta some.
create policy "denuncia_autores: dono ou admin" on denuncia_autores for select using (
  auth.uid () = user_id
  or is_admin ()
);

-- 2. Copia a autoria que já existe.
insert into
  denuncia_autores (denuncia_id, user_id)
select
  id,
  user_id
from
  denuncias;

-- 3. Troca as policies que dependiam da coluna e remove a coluna.
drop policy "denuncias: insercao autenticada" on denuncias;
drop policy "denuncias: update dono ou admin" on denuncias;
drop policy "denuncias: delete dono ou admin" on denuncias;

alter table denuncias drop column user_id;

-- Sem policy de insert: denúncias novas só entram pela função `criar_denuncia`.
create policy "denuncias: update dono ou admin" on denuncias for update using (
  is_admin ()
  or exists (
    select 1
    from denuncia_autores a
    where a.denuncia_id = denuncias.id
      and a.user_id = auth.uid ()
  )
);

create policy "denuncias: delete dono ou admin" on denuncias for delete using (
  is_admin ()
  or exists (
    select 1
    from denuncia_autores a
    where a.denuncia_id = denuncias.id
      and a.user_id = auth.uid ()
  )
);

-- 4. Criação da denúncia: grava denúncia e autoria juntas, em nome de quem está logado.
create function criar_denuncia (
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

  insert into denuncias (linha_id, tipo, descricao, numero_veiculo, latitude, longitude)
  values (p_linha_id, p_tipo, p_descricao, p_numero_veiculo, p_latitude, p_longitude)
  returning id into nova;

  insert into denuncia_autores (denuncia_id, user_id) values (nova, auth.uid ());

  return nova;
end;
$$ language plpgsql security definer
set search_path = public;

revoke all on function criar_denuncia (uuid, text, text, text, double precision, double precision)
from
  public,
  anon;

grant
execute on function criar_denuncia (uuid, text, text, text, double precision, double precision) to authenticated;

-- 5. "Minhas denúncias": só as do usuário logado (as regras de acesso valem para quem consulta).
create view minhas_denuncias
with
  (security_invoker = true) as
select d.*
from denuncias d
join denuncia_autores a on a.denuncia_id = d.id
where a.user_id = auth.uid ();

grant select on minhas_denuncias to authenticated;

-- 6. Admin: quantas denúncias cada usuário fez (quem não é admin só enxerga as próprias).
create function denuncias_por_usuario () returns table (user_id uuid, total bigint) as $$
  select a.user_id, count(*) as total
  from denuncia_autores a
  group by a.user_id;
$$ language sql stable;

grant execute on function denuncias_por_usuario () to authenticated;

-- 7. Excluir um usuário continua apagando as denúncias dele (antes era a cascata da coluna).
create or replace function admin_excluir_usuario (alvo uuid) returns void as $$
begin
  if not is_admin () then
    raise exception 'não autorizado';
  end if;
  if alvo = auth.uid () then
    raise exception 'não é possível excluir a si mesmo';
  end if;
  delete from denuncias
  where id in (select denuncia_id from denuncia_autores where user_id = alvo);
  delete from auth.users where id = alvo;
end;
$$ language plpgsql security definer
set search_path = public;
