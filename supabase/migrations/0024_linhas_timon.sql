-- Nova zona 'timon' e as linhas do transporte coletivo de Timon (EPTT), com ponte de travessia para Teresina.
-- Códigos com prefixo "T" para não colidir com as linhas de Teresina; zona 'timon'.
alter table linhas drop constraint linhas_zona_check;

alter table linhas add constraint linhas_zona_check check (
  zona in ('norte', 'sul', 'leste', 'sudeste', 'timon', 'outras')
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
  ('T01', 'TIMON MIGUEL ARRAES - PONTE VELHA VIA AV. PRESIDENTE MEDICI', 'timon'),
  ('T02', 'TIMON MIGUEL ARRAES - PONTE NOVA VIA PARQUE ALVORADA', 'timon'),
  ('T03', 'TIMON RUA 100 - PONTE VELHA VIA RESIDENCIAL COCAIS', 'timon'),
  ('T04', 'TIMON RUA 100 - PONTE NOVA VIA HOSPITAL REGIONAL', 'timon'),
  ('T05', 'TIMON PARQUE ALVORADA - PONTE VELHA VIA EMILIO FALCAO', 'timon'),
  ('T06', 'TIMON NOVO TEMPO - PONTE VELHA VIA CONJUNTO BOA VISTA', 'timon'),
  ('T07', 'TIMON NOVO TEMPO - PONTE NOVA VIA CONJUNTO BOA VISTA', 'timon'),
  ('T08', 'TIMON JULIO ALMEIDA - PONTE VELHA VIA MUTIRAO', 'timon'),
  ('T09', 'TIMON JULIO ALMEIDA - PONTE VELHA VIA HOSPITAL', 'timon'),
  ('T10', 'TIMON JULIO ALMEIDA - PONTE NOVA VIA PARQUE ALVORADA', 'timon'),
  ('T11', 'TIMON SHOPPING VIA SHOPPING CENTERS', 'timon')
  ) as v (codigo, nome, zona)
where
  not exists (
    select 1 from linhas l where l.codigo = v.codigo
  );
