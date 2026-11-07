-- O admin não conseguia apagar fotos de outras pessoas (órfãs, recusadas, de denúncias excluídas).
-- O Storage apaga com `DELETE ... RETURNING`, e o Postgres exige que a linha também passe numa policy
-- de SELECT. As únicas policies de SELECT do bucket são "dono le" (só os próprios arquivos), então a
-- policy de DELETE do admin (0029) casava com zero linhas: a API respondia sucesso sem apagar nada.

create policy "denuncias-fotos: admin le" on storage.objects for
select
  to authenticated using (
    bucket_id = 'denuncias-fotos'
    and public.is_admin ()
  );
