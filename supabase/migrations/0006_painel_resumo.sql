-- Resumo do painel público, calculado no banco: devolve algumas dezenas de números em vez de
-- todas as denúncias, o que poupa tráfego de saída do Supabase quando o painel tem muito acesso.
--
--   dias        : janela em dias contando hoje (7, 30...); null = todo o histórico
--   zona_filtro : 'norte' | 'sul' | 'leste' | 'sudeste' | 'outras'; null = todas as zonas
--
-- Dias são contados no fuso de Teresina (America/Fortaleza). Não expõe usuários nem textos:
-- só contagens (as denúncias já têm leitura pública, então a função roda com as permissões
-- de quem chama).
create or replace function painel_resumo (dias int default null, zona_filtro text default null) returns jsonb as $$
  with hoje as (
    select (now() at time zone 'America/Fortaleza')::date as dia_hoje
  ),
  todas as (
    select
      d.tipo,
      d.status,
      d.linha_id,
      l.codigo,
      l.nome,
      coalesce(l.zona, 'outras') as zona,
      (d.created_at at time zone 'America/Fortaleza')::date as dia
    from denuncias d
    left join linhas l on l.id = d.linha_id
    where zona_filtro is null or coalesce(l.zona, 'outras') = zona_filtro
  ),
  periodo as (
    select * from todas
    where dias is null or dia > (select dia_hoje from hoje) - dias
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
      from (select zona, count(*) as total from periodo group by zona) x
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
        group by linha_id, codigo, nome
        order by total desc, codigo
        limit 5
      ) x
    ), '[]'::jsonb),
    'porDia', (
      select jsonb_agg(jsonb_build_object('dia', s.dia, 'total', coalesce(p.total, 0)) order by s.dia)
      from serie s
      left join por_dia p on p.dia = s.dia
    )
  );
$$ language sql stable
set search_path = public;

grant execute on function painel_resumo (int, text) to anon, authenticated;
