-- O contador do painel (Total, Pendentes, Resolvidas, Hoje e o gráfico "Por dia") passa a contar
-- ônibus E paradas juntos, como um contador só. A 0038 tinha deixado as paradas de fora.
--
-- Parada não tem linha nem zona, então:
--   * as quebras por zona e o ranking de linhas continuam só com ônibus;
--   * escolher uma zona no painel mostra só os ônibus daquela zona (parada não pertence a zona);
--   * "Por tipo de problema" inclui os tipos de parada.
-- O bloco de acessibilidade (tipo 'pcd') segue só com ônibus.
create or replace function painel_resumo (dias int default null, zona_filtro text default null) returns jsonb as $$
  with hoje as (
    select (now() at time zone 'America/Fortaleza')::date as dia_hoje
  ),
  todas as (
    select
      d.tipo,
      d.status,
      d.linha_id,
      nullif(upper(trim(d.numero_veiculo)), '') as veiculo,
      l.codigo,
      l.nome,
      case when d.local_tipo = 'parada' then null else coalesce(l.zona, 'outras') end as zona,
      (d.created_at at time zone 'America/Fortaleza')::date as dia
    from denuncias d
    left join linhas l on l.id = d.linha_id
    where zona_filtro is null
      or (d.local_tipo = 'onibus' and coalesce(l.zona, 'outras') = zona_filtro)
  ),
  periodo as (
    select * from todas
    where dias is null or dia > (select dia_hoje from hoje) - dias
  ),
  pcd as (
    select * from periodo where tipo = 'pcd'
  ),
  serie as (
    select g::date as dia
    from generate_series(
      (select dia_hoje from hoje) - 13,
      (select dia_hoje from hoje),
      interval '1 day'
    ) g
  ),
  por_dia as (
    select dia, count(*) as total from todas group by dia
  )
  select jsonb_build_object(
    'total', (select count(*) from periodo),
    'pendentes', (select count(*) from periodo where status = 'pendente'),
    'resolvidas', (select count(*) from periodo where status = 'resolvido'),
    'porZona', coalesce((
      select jsonb_agg(jsonb_build_object('chave', zona, 'total', total) order by total desc, zona)
      from (select zona, count(*) as total from periodo where zona is not null group by zona) x
    ), '[]'::jsonb),
    'porTipo', coalesce((
      select jsonb_agg(jsonb_build_object('chave', tipo, 'total', total) order by total desc, tipo)
      from (select tipo, count(*) as total from periodo group by tipo) x
    ), '[]'::jsonb),
    'topLinhas', coalesce((
      select jsonb_agg(
        jsonb_build_object('linhaId', linha_id, 'codigo', codigo, 'nome', nome, 'total', total)
        order by total desc, codigo
      )
      from (
        select linha_id, codigo, nome, count(*) as total
        from periodo
        where linha_id is not null
        group by linha_id, codigo, nome
        order by total desc, codigo
        limit 5
      ) x
    ), '[]'::jsonb),
    'acessibilidade', jsonb_build_object(
      'total', (select count(*) from pcd),
      'pendentes', (select count(*) from pcd where status = 'pendente'),
      'porTipo', coalesce((
        select jsonb_agg(jsonb_build_object('chave', tipo, 'total', total) order by total desc, tipo)
        from (select tipo, count(*) as total from pcd group by tipo) x
      ), '[]'::jsonb),
      'topLinhas', coalesce((
        select jsonb_agg(
          jsonb_build_object('linhaId', linha_id, 'codigo', codigo, 'nome', nome, 'total', total)
          order by total desc, codigo
        )
        from (
          select linha_id, codigo, nome, count(*) as total
          from pcd
          group by linha_id, codigo, nome
          order by total desc, codigo
          limit 5
        ) x
      ), '[]'::jsonb),
      'topVeiculos', coalesce((
        select jsonb_agg(jsonb_build_object('numero', veiculo, 'total', total) order by total desc, veiculo)
        from (
          select veiculo, count(*) as total
          from pcd
          where veiculo is not null
          group by veiculo
          order by total desc, veiculo
          limit 5
        ) x
      ), '[]'::jsonb)
    ),
    'porDia', (
      select jsonb_agg(jsonb_build_object('dia', s.dia, 'total', coalesce(p.total, 0)) order by s.dia)
      from serie s
      left join por_dia p on p.dia = s.dia
    )
  );
$$ language sql stable
set search_path = public;

grant execute on function painel_resumo (int, text) to anon, authenticated;
