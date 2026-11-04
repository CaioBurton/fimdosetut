-- Linhas do transporte coletivo de Timon (EPTT), com ponte de travessia para Teresina.
-- Códigos com prefixo "T" para não colidir com as linhas de Teresina; zona 'outras'.
insert into
  linhas (codigo, nome, zona)
select
  v.codigo,
  v.nome,
  v.zona
from
  (
    values
  ('T01', 'TIMON MIGUEL ARRAES - PONTE VELHA VIA AV. PRESIDENTE MEDICI', 'outras'),
  ('T02', 'TIMON MIGUEL ARRAES - PONTE NOVA VIA PARQUE ALVORADA', 'outras'),
  ('T03', 'TIMON RUA 100 - PONTE VELHA VIA RESIDENCIAL COCAIS', 'outras'),
  ('T04', 'TIMON RUA 100 - PONTE NOVA VIA HOSPITAL REGIONAL', 'outras'),
  ('T05', 'TIMON PARQUE ALVORADA - PONTE VELHA VIA EMILIO FALCAO', 'outras'),
  ('T06', 'TIMON NOVO TEMPO - PONTE VELHA VIA CONJUNTO BOA VISTA', 'outras'),
  ('T07', 'TIMON NOVO TEMPO - PONTE NOVA VIA CONJUNTO BOA VISTA', 'outras'),
  ('T08', 'TIMON JULIO ALMEIDA - PONTE VELHA VIA MUTIRAO', 'outras'),
  ('T09', 'TIMON JULIO ALMEIDA - PONTE VELHA VIA HOSPITAL', 'outras'),
  ('T10', 'TIMON JULIO ALMEIDA - PONTE NOVA VIA PARQUE ALVORADA', 'outras'),
  ('T11', 'TIMON SHOPPING VIA SHOPPING CENTERS', 'outras')
  ) as v (codigo, nome, zona)
where
  not exists (
    select 1 from linhas l where l.codigo = v.codigo
  );
