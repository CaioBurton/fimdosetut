-- Fotos órfãs: arquivos do bucket `denuncias-fotos` que nenhuma denúncia (publicada ou na fila de
-- aprovação) usa mais. Nascem quando a exclusão do arquivo falha depois de apagar a denúncia, quando
-- a denúncia é apagada direto no banco, ou quando a aba é fechada entre o envio e a criação.
--
-- O Storage não deixa apagar `storage.objects` por SQL, então esta função só LISTA; quem apaga é o
-- app (admin), pela API. Só arquivos com mais de 1 dia, para não pegar um envio que acabou de
-- subir e cuja denúncia ainda está sendo criada.

create function fotos_orfas () returns setof text as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'denuncias-fotos'
    and o.created_at < now() - interval '1 day'
    and is_admin ()
    and not exists (select 1 from denuncias d where d.foto_path = o.name)
    and not exists (select 1 from fotos_pendentes p where p.foto_path = o.name)
  order by o.created_at
  limit 1000;
$$ language sql stable security definer
set search_path = public;

revoke all on function fotos_orfas ()
from
  public,
  anon;

grant
execute on function fotos_orfas () to authenticated;
