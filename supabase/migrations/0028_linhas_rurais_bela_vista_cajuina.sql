-- Mais duas linhas da zona rural, também sem número (código "RURAL").
insert into
  linhas (codigo, nome, zona)
select
  v.codigo,
  v.nome,
  v.zona
from
  (
    values
  ('RURAL', 'BELA VISTA', 'rural'),
  ('RURAL', 'CAJUÍNA', 'rural')
  ) as v (codigo, nome, zona)
where
  not exists (
    select 1 from linhas l where l.nome = v.nome and l.zona = v.zona
  );
