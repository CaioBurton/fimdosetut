-- Fila de aprovação das fotos das denúncias.
--
-- A denúncia continua aparecendo na hora; só a FOTO espera. Ela fica em `fotos_pendentes`
-- (tabela privada) com `denuncias.foto_path` vazio, então a foto não aparece em lugar nenhum até o
-- admin aprovar. Quem é de confiança publica direto: admins e contas com cadastro que já tiveram
-- 3 ou mais denúncias confirmadas por outras pessoas ("Também vi"), a mesma ideia dos selos.
-- Contas anônimas e novas sempre passam pela fila.
--
-- O arquivo já fica no bucket público, mas com nome aleatório (UUID) que só o autor e o admin
-- conhecem enquanto está na fila. Recusar ou remover apaga o arquivo pela API do Storage (o app
-- faz isso, porque o Supabase não deixa apagar arquivos por SQL).

-- 1. Fila.
create table fotos_pendentes (
  denuncia_id uuid primary key references denuncias (id) on delete cascade,
  foto_path text not null unique check (
    foto_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'
  ),
  created_at timestamptz not null default now()
);

create index fotos_pendentes_created_at_idx on fotos_pendentes (created_at);

alter table fotos_pendentes enable row level security;

revoke all on fotos_pendentes
from
  anon;

grant select on fotos_pendentes to authenticated;

-- Só leitura, do autor da denúncia (para ver "foto em análise") ou do admin. Escrita só pelas
-- funções abaixo.
create policy "fotos_pendentes: autor ou admin" on fotos_pendentes for
select
  using (
    (select is_admin ())
    or exists (
      select 1
      from denuncia_autores a
      where a.denuncia_id = fotos_pendentes.denuncia_id
        and a.user_id = (select auth.uid ())
    )
  );

-- 2. Ninguém além do admin coloca uma foto na denúncia por update direto (o dono pode editar a
-- própria denúncia, e sem isto conseguiria publicar uma foto sem passar pela fila). Tirar a foto
-- (voltar para null) continua liberado para o dono e o admin.
create function proteger_foto_path () returns trigger as $$
begin
  if new.foto_path is not null
    and new.foto_path is distinct from old.foto_path
    and not is_admin () then
    raise exception 'foto precisa de aprovação';
  end if;
  return new;
end;
$$ language plpgsql
set search_path = public;

revoke execute on function proteger_foto_path ()
from
  public,
  anon,
  authenticated;

create trigger denuncias_proteger_foto_path before
update of foto_path on denuncias for each row
execute function proteger_foto_path ();

-- 3. Quem publica foto sem esperar a fila.
create function foto_dispensa_aprovacao () returns boolean as $$
  select
    not coalesce((auth.jwt () ->> 'is_anonymous')::boolean, false)
    and (
      is_admin ()
      or (
        select count(*)
        from denuncia_autores a
        join denuncias d on d.id = a.denuncia_id
        where a.user_id = auth.uid ()
          and d.confirmacoes > 0
      ) >= 3
    );
$$ language sql stable security definer
set search_path = public;

revoke all on function foto_dispensa_aprovacao ()
from
  public,
  anon;

grant
execute on function foto_dispensa_aprovacao () to authenticated;

-- 4. `criar_denuncia`: a foto vai para a fila, a não ser para quem é de confiança. A assinatura
-- não muda (é a da 0029).
create or replace function criar_denuncia (
  p_linha_id uuid,
  p_tipo text,
  p_descricao text,
  p_numero_veiculo text,
  p_latitude double precision,
  p_longitude double precision,
  p_foto_path text default null
) returns uuid as $$
declare
  nova uuid;
  v_foto text := nullif(p_foto_path, '');
  v_direto boolean;
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

  v_direto := v_foto is not null and foto_dispensa_aprovacao ();

  insert into denuncias (linha_id, tipo, descricao, numero_veiculo, latitude, longitude, foto_path)
  values (
    p_linha_id, p_tipo, p_descricao, p_numero_veiculo, p_latitude, p_longitude,
    case when v_direto then v_foto end
  )
  returning id into nova;

  insert into denuncia_autores (denuncia_id, user_id) values (nova, auth.uid ());

  if v_foto is not null and not v_direto then
    insert into fotos_pendentes (denuncia_id, foto_path) values (nova, v_foto);
  end if;

  return nova;
end;
$$ language plpgsql security definer
set search_path = public;

-- 5. Admin aprova: a foto passa para a denúncia e sai da fila.
create function aprovar_foto (p_denuncia_id uuid) returns void as $$
declare
  v_foto text;
begin
  if not is_admin () then
    raise exception 'não autorizado';
  end if;

  delete from fotos_pendentes where denuncia_id = p_denuncia_id
  returning foto_path into v_foto;
  if v_foto is null then
    raise exception 'foto não encontrada na fila';
  end if;

  update denuncias set foto_path = v_foto where id = p_denuncia_id;
end;
$$ language plpgsql security definer
set search_path = public;

-- 6. Admin recusa: sai da fila e devolve o caminho, para o app apagar o arquivo.
create function recusar_foto (p_denuncia_id uuid) returns text as $$
declare
  v_foto text;
begin
  if not is_admin () then
    raise exception 'não autorizado';
  end if;

  delete from fotos_pendentes where denuncia_id = p_denuncia_id
  returning foto_path into v_foto;
  return v_foto;
end;
$$ language plpgsql security definer
set search_path = public;

revoke all on function aprovar_foto (uuid)
from
  public,
  anon;

revoke all on function recusar_foto (uuid)
from
  public,
  anon;

grant
execute on function aprovar_foto (uuid) to authenticated;

grant
execute on function recusar_foto (uuid) to authenticated;

-- 7. As fotos que ainda estão na fila também saem ao excluir a conta.
create or replace function fotos_do_usuario (alvo uuid) returns setof text as $$
  select f.foto_path
  from (
    select d.id as denuncia_id, d.foto_path from denuncias d
    union all
    select p.denuncia_id, p.foto_path from fotos_pendentes p
  ) f
  join denuncia_autores a on a.denuncia_id = f.denuncia_id
  where a.user_id = alvo
    and f.foto_path is not null
    and (alvo = auth.uid () or is_admin ());
$$ language sql stable security definer
set search_path = public;
