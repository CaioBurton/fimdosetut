-- Nova zona 'rural' e as três linhas da zona rural, que não têm número.
-- O código usa o rótulo "RURAL" (o nome da linha já identifica cada uma).
alter table linhas drop constraint linhas_zona_check;

alter table linhas add constraint linhas_zona_check check (
  zona in ('norte', 'sul', 'leste', 'sudeste', 'timon', 'rural', 'outras')
);

insert into
  linhas (codigo, nome, zona)
select
  v.codigo,
  v.nome,
  v.zona
from
  (
    values
  ('RURAL', 'CAMPESTRE NORTE', 'rural'),
  ('RURAL', 'SANTA LUZ', 'rural'),
  ('RURAL', 'FAZENDA SOARES', 'rural')
  ) as v (codigo, nome, zona)
where
  not exists (
    select 1 from linhas l where l.nome = v.nome and l.zona = v.zona
  );
