-- Correção da política de envio de fotos (0029): a policy de INSERT em `storage.objects`
-- continha um `select count(*)` na própria `storage.objects`. O Postgres reaplica a RLS em
-- cada nível da consulta e, ao reencontrar a mesma tabela, acusa `42P17 infinite recursion
-- detected in policy for relation "storage.objects"` — que o serviço de Storage devolve como
-- 503 DatabaseInvalidObjectDefinition. Resultado: todo envio de foto falhava.
--
-- Como fica: a contagem das 20 fotos/dia passa para uma função SECURITY DEFINER (dona:
-- postgres, que ignora a RLS por dentro). A política só chama a função e não consulta mais
-- a tabela, então a expansão da RLS não entra em loop. O limite e o comportamento não mudam.

-- 1. Contagem de fotos enviadas nas últimas 24 horas pela pessoa (o owner do arquivo é o id
--    dela). SECURITY DEFINER com dono postgres: por dentro, a RLS de storage.objects não se
--    aplica, então não há recursão. Referências com schema explícito porque o search_path é
--    só `public`. Só responde sobre si mesmo (ou qualquer um, para o admin).
create function public.contar_fotos_hoje (dono text) returns bigint as $$
  select count(*)
  from storage.objects o
  where o.bucket_id = 'denuncias-fotos'
    and o.owner_id = dono
    and o.created_at > now() - interval '1 day'
    and (dono = (select auth.uid ())::text or public.is_admin ());
$$ language sql stable security definer
set search_path = public;

revoke all on function public.contar_fotos_hoje (text)
from
  public,
  anon;

grant
execute on function public.contar_fotos_hoje (text) to authenticated;

-- 2. Política de envio sem a subconsulta na própria storage.objects.
drop policy "denuncias-fotos: envio" on storage.objects;

create policy "denuncias-fotos: envio" on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'denuncias-fotos'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'
    and not public.is_banido ()
    and public.contar_fotos_hoje ((select auth.uid ())::text) < 20
  );
