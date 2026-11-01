-- CRUD de linhas: só admin cria, altera e exclui (a leitura continua pública).
create policy "linhas: insert admin" on linhas for insert
with
  check (is_admin ());

create policy "linhas: update admin" on linhas for update using (is_admin ())
with
  check (is_admin ());

create policy "linhas: delete admin" on linhas for delete using (is_admin ());

-- Obs.: denuncias.linha_id referencia linhas sem cascade, então o banco recusa
-- a exclusão de uma linha que ainda tem denúncias (o app também bloqueia o botão).
