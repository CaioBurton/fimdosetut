-- Denúncias de paradas de ônibus.
--
-- Não há cadastro de paradas: a denúncia de parada guarda só o ponto marcado no mapa (latitude e
-- longitude, que já existem) e uma referência em texto, opcional ("Av. Frei Serafim, perto do
-- nº 1450"). Por isso uma denúncia de parada não tem linha (`linha_id` fica nulo).
--
--   local_tipo         'onibus' (padrão, tudo o que já existe) ou 'parada'
--   referencia_parada  texto livre de até 80 caracteres, só para paradas
--
-- Os tipos de problema de parada começam com `parada_`.

-- 1. Colunas novas e `linha_id` opcional.
alter table denuncias
  add column local_tipo text not null default 'onibus'
    check (local_tipo in ('onibus', 'parada')),
  add column referencia_parada text
    check (referencia_parada is null or char_length(referencia_parada) <= 80);

alter table denuncias alter column linha_id drop not null;

-- 2. Tipos de problema de parada. O tipo e o local andam juntos, e só ônibus tem linha.
alter table denuncias drop constraint if exists denuncias_tipo_check;

alter table denuncias
  add constraint denuncias_tipo_check check (
    tipo in (
      'quebrado', 'acidente', 'atraso', 'lotacao', 'nao_passou', 'ar_condicionado', 'gps', 'pcd', 'outro',
      'parada_sem_abrigo', 'parada_sem_banco', 'parada_sem_placa', 'parada_sujeira',
      'parada_sem_iluminacao', 'parada_inseguranca', 'parada_pcd', 'parada_outro'
    )
  ),
  add constraint denuncias_local_check check (
    (local_tipo = 'onibus' and linha_id is not null and left(tipo, 7) <> 'parada_')
    or (local_tipo = 'parada' and linha_id is null and left(tipo, 7) = 'parada_')
  );

create index denuncias_local_tipo_idx on denuncias (local_tipo);

-- 3. "Minhas denúncias" passa a incluir as colunas novas (o `d.*` é expandido na criação).
create or replace view minhas_denuncias
with
  (security_invoker = true) as
select d.*
from denuncias d
join denuncia_autores a on a.denuncia_id = d.id
where a.user_id = auth.uid ();

-- 4. `criar_denuncia` ganha o local e a referência. A assinatura muda, então a antiga sai
-- (duas versões em paralelo deixariam a chamada ambígua).
drop function criar_denuncia (uuid, text, text, text, double precision, double precision, text);

create function criar_denuncia (
  p_linha_id uuid,
  p_tipo text,
  p_descricao text,
  p_numero_veiculo text,
  p_latitude double precision,
  p_longitude double precision,
  p_foto_path text default null,
  p_local_tipo text default 'onibus',
  p_referencia_parada text default null
) returns uuid as $$
declare
  nova uuid;
  v_foto text := nullif(p_foto_path, '');
  v_direto boolean;
  v_parada boolean := p_local_tipo = 'parada';
begin
  if auth.uid () is null then
    raise exception 'não autenticado';
  end if;
  if is_banido () then
    raise exception 'usuário bloqueado';
  end if;

  if coalesce((auth.jwt () ->> 'is_anonymous')::boolean, false)
    and (
      select count(*)
      from denuncia_autores a
      join denuncias d on d.id = a.denuncia_id
      where a.user_id = auth.uid ()
        and d.created_at > now() - interval '1 hour'
    ) >= 5 then
    raise exception 'limite de denúncias por hora atingido';
  end if;

  v_direto := v_foto is not null and foto_dispensa_aprovacao ();

  insert into denuncias (
    linha_id, tipo, descricao, numero_veiculo, latitude, longitude, foto_path,
    local_tipo, referencia_parada
  )
  values (
    case when v_parada then null else p_linha_id end,
    p_tipo,
    p_descricao,
    case when v_parada then null else p_numero_veiculo end,
    p_latitude,
    p_longitude,
    case when v_direto then v_foto end,
    p_local_tipo,
    case when v_parada then nullif(left(trim(p_referencia_parada), 80), '') end
  )
  returning id into nova;

  insert into denuncia_autores (denuncia_id, user_id) values (nova, auth.uid ());

  if v_foto is not null and not v_direto then
    insert into fotos_pendentes (denuncia_id, foto_path) values (nova, v_foto);
  end if;

  return nova;
end;
$$ language plpgsql security definer
set search_path = public;

revoke all on function criar_denuncia (uuid, text, text, text, double precision, double precision, text, text, text)
from
  public,
  anon;

grant
execute on function criar_denuncia (uuid, text, text, text, double precision, double precision, text, text, text) to authenticated;

-- 5. O painel é sobre linhas de ônibus: denúncias de parada (sem linha) ficam fora dos totais e
-- dos rankings. É a mesma função da 0025, com o filtro `local_tipo = 'onibus'` em `todas`.
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
      coalesce(l.zona, 'outras') as zona,
      (d.created_at at time zone 'America/Fortaleza')::date as dia
    from denuncias d
    left join linhas l on l.id = d.linha_id
    where d.local_tipo = 'onibus'
      and (zona_filtro is null or coalesce(l.zona, 'outras') = zona_filtro)
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
