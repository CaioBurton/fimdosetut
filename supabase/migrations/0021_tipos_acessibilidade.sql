-- Tipos de denúncia de acessibilidade (PcD): plataforma/elevador quebrado,
-- falta de espaço reservado e motorista que não parou ou não ajudou.
alter table denuncias drop constraint if exists denuncias_tipo_check;

alter table denuncias
  add constraint denuncias_tipo_check check (
    tipo in (
      'quebrado',
      'acidente',
      'atraso',
      'lotacao',
      'outro',
      'pcd_elevador',
      'pcd_espaco',
      'pcd_motorista'
    )
  );
