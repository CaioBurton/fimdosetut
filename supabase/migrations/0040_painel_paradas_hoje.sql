-- (Histórico) Esta migration já foi aplicada em alguns bancos. O app deixou de usar o campo `hoje`; ele só sobra na resposta da função e é ignorado.
-- `painel_paradas` passa a devolver também `hoje`: as denúncias de parada de hoje (dia de Teresina),
-- para o painel mostrar o mesmo contador dos ônibus. `hoje` não depende do período escolhido, como
-- o "Hoje" do resumo de ônibus. O resto continua igual ao da 0039.
create or replace function painel_paradas (dias int default null) returns jsonb as $$
  with hoje as (
    select (now() at time zone 'America/Fortaleza')::date as dia_hoje
  ),
  todas as (
    select
      d.tipo,
      d.status,
      (d.created_at at time zone 'America/Fortaleza')::date as dia
    from denuncias d
    where d.local_tipo = 'parada'
  ),
  periodo as (
    select * from todas
    where dias is null or dia > (select dia_hoje from hoje) - dias
  )
  select jsonb_build_object(
    'total', (select count(*) from periodo),
    'pendentes', (select count(*) from periodo where status = 'pendente'),
    'resolvidas', (select count(*) from periodo where status = 'resolvido'),
    'hoje', (select count(*) from todas where dia = (select dia_hoje from hoje)),
    'porTipo', coalesce((
      select jsonb_agg(jsonb_build_object('chave', tipo, 'total', total) order by total desc, tipo)
      from (select tipo, count(*) as total from periodo group by tipo) x
    ), '[]'::jsonb)
  );
$$ language sql stable
set search_path = public;

grant execute on function painel_paradas (int) to anon, authenticated;
