-- Foto opcional na denúncia, guardada no Supabase Storage (plano gratuito: 1 GB de arquivos e
-- 5 GB/mês de tráfego de saída).
--
-- Como fica:
-- - O app comprime a foto no aparelho (WebP, lado maior até 1280 px, ~100–200 KB) e tira os
--   metadados (EXIF, inclusive o GPS da câmera) antes de enviar.
-- - Bucket público `denuncias-fotos`: a imagem é lida pela URL pública (com cache de CDN), sem
--   policy de leitura. Limite de 512 KB por arquivo e só WebP/JPEG, checados pelo próprio Storage.
-- - O nome do arquivo é um UUID aleatório, SEM o id de quem enviou: a autoria das denúncias é
--   privada (ver 0009) e um caminho `{user_id}/...` na URL pública vazaria isso. O dono do arquivo
--   fica em `storage.objects.owner_id`, que não é público.
-- - Cada conta (inclusive anônima) envia no máximo 20 fotos por dia.
-- - A denúncia guarda só o caminho (`foto_path`). Apagar a denúncia ou a conta não apaga o arquivo
--   pelo banco (o Supabase não deixa apagar arquivos por SQL): o app remove a foto pela API do
--   Storage antes. Por isso o dono e o admin podem apagar fotos.

-- 1. Bucket.
insert into
  storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'denuncias-fotos',
    'denuncias-fotos',
    true,
    524288,
    array['image/webp', 'image/jpeg']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Regras de acesso aos arquivos.
-- Cada pessoa enxerga (lista) só os próprios arquivos. Serve para a contagem do limite diário e
-- para apagar tudo ao excluir a conta; a foto em si é lida pela URL pública.
create policy "denuncias-fotos: dono le" on storage.objects for
select
  to authenticated using (
    bucket_id = 'denuncias-fotos'
    and owner_id = (select auth.uid ())::text
  );

create policy "denuncias-fotos: envio" on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'denuncias-fotos'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'
    and not public.is_banido ()
    and (
      select count(*)
      from storage.objects o
      where o.bucket_id = 'denuncias-fotos'
        and o.owner_id = (select auth.uid ())::text
        and o.created_at > now() - interval '1 day'
    ) < 20
  );

create policy "denuncias-fotos: dono ou admin apaga" on storage.objects for delete to authenticated using (
  bucket_id = 'denuncias-fotos'
  and (
    owner_id = (select auth.uid ())::text
    or public.is_admin ()
  )
);

-- 3. Coluna na denúncia (única: uma foto não pode ser usada por duas denúncias).
alter table denuncias
add column foto_path text unique check (
  foto_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'
);

-- A visão "minhas denúncias" passa a incluir a nova coluna (o `d.*` é expandido na criação).
create or replace view minhas_denuncias
with
  (security_invoker = true) as
select d.*
from denuncias d
join denuncia_autores a on a.denuncia_id = d.id
where a.user_id = auth.uid ();

-- 4. `criar_denuncia` ganha a foto (opcional). A assinatura muda, então a antiga sai: duas versões
-- com o mesmo nome deixariam a chamada sem foto ambígua.
drop function criar_denuncia (uuid, text, text, text, double precision, double precision);

create function criar_denuncia (
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

  -- O formato é checado pela coluna e a unicidade impede reaproveitar a foto de outra denúncia.
  -- Um caminho de arquivo que não existe só resulta numa imagem quebrada, sem expor nada.
  insert into denuncias (linha_id, tipo, descricao, numero_veiculo, latitude, longitude, foto_path)
  values (p_linha_id, p_tipo, p_descricao, p_numero_veiculo, p_latitude, p_longitude, nullif(p_foto_path, ''))
  returning id into nova;

  insert into denuncia_autores (denuncia_id, user_id) values (nova, auth.uid ());

  return nova;
end;
$$ language plpgsql security definer
set search_path = public;

revoke all on function criar_denuncia (uuid, text, text, text, double precision, double precision, text)
from
  public,
  anon;

grant
execute on function criar_denuncia (uuid, text, text, text, double precision, double precision, text) to authenticated;

-- 5. Fotos das denúncias de uma pessoa, para o app apagá-las antes de excluir a conta (a própria ou,
-- pelo admin, a de outra pessoa). Só responde sobre si mesmo, ou sobre qualquer um para o admin.
create function fotos_do_usuario (alvo uuid) returns setof text as $$
  select d.foto_path
  from denuncias d
  join denuncia_autores a on a.denuncia_id = d.id
  where a.user_id = alvo
    and d.foto_path is not null
    and (alvo = auth.uid () or is_admin ());
$$ language sql stable security definer
set search_path = public;

revoke all on function fotos_do_usuario (uuid)
from
  public,
  anon;

grant
execute on function fotos_do_usuario (uuid) to authenticated;
