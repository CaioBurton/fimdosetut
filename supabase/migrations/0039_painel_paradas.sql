-- Painel público: resumo das denúncias de PARADA (a `painel_resumo` conta só ônibus, desde a 0038).
--
-- Devolve, para o período pedido (`dias` nulo = todo o histórico, mesma regra da `painel_resumo`),
-- o total, quantas estão pendentes e resolvidas e o total por tipo de problema. Parada não tem zona
-- nem linha, então não há filtro de zona. Só totais: nada que identifique pessoas.
create or replace function painel_paradas (dias int default null) returns jsonb as $$
  with hoje as (
    select (now() at time zone 'America/Fortaleza')::date as dia_hoje
  ),
  periodo as (
    select d.tipo, d.status
    from denuncias d
    where d.local_tipo = 'parada'
      and (
        dias is null
        or (d.created_at at time zone 'America/Fortaleza')::date > (select dia_hoje from hoje) - dias
      )
  )
  select jsonb_build_object(
    'total', (select count(*) from periodo),
    'pendentes', (select count(*) from periodo where status = 'pendente'),
    'resolvidas', (select count(*) from periodo where status = 'resolvido'),
    'porTipo', coalesce((
      select jsonb_agg(jsonb_build_object('chave', tipo, 'total', total) order by total desc, tipo)
      from (select tipo, count(*) as total from periodo group by tipo) x
    ), '[]'::jsonb)
  );
$$ language sql stable
set search_path = public;

grant execute on function painel_paradas (int) to anon, authenticated;
