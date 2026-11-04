-- Pequenos incentivos, sem competição entre pessoas.
--
-- 1. `meus_selos()`: números que alimentam os selos de quem está logado (visíveis só para a própria
--    pessoa). O ganho vem de denúncias que OUTRAS pessoas confirmaram ("Também vi"), e não de
--    quantas denúncias a pessoa enviou: mandar denúncia falsa não rende selo. Não existe ranking
--    de pessoas.
-- 2. `ranking_linhas_semana()`: ranking público de LINHAS (nunca de pessoas) dos últimos 7 dias.
--    Só entram linhas denunciadas por pelo menos 2 pessoas diferentes, para uma conta sozinha não
--    conseguir fabricar a "linha mais problemática da semana". O banco devolve só totais: quem
--    denunciou continua privado.

-- 1. Selos da própria pessoa ------------------------------------------------------------------
-- Lê só linhas que a pessoa já enxerga (as próprias autorias e confirmações, e denúncias/linhas
-- públicas), então roda com os privilégios de quem chama.
create function meus_selos () returns jsonb as $$
  with minhas as (
    select d.linha_id, d.confirmacoes, d.created_at
    from denuncia_autores a
    join denuncias d on d.id = a.denuncia_id
    where a.user_id = auth.uid ()
  ),
  -- dias (no fuso de Teresina) em que a pessoa colaborou: enviou uma denúncia ou confirmou uma
  dias as (
    select (created_at at time zone 'America/Fortaleza')::date as dia
    from minhas
    union
    select (c.created_at at time zone 'America/Fortaleza')::date
    from denuncia_confirmacoes c
    where c.user_id = auth.uid ()
  ),
  -- dias seguidos viram um grupo só: dia - posição na ordem é constante dentro da sequência
  ilhas as (
    select dia, dia - (row_number() over (order by dia))::int as grupo
    from dias
  ),
  sequencias as (
    select count(*)::int as tamanho, max(dia) as fim
    from ilhas
    group by grupo
  )
  select jsonb_build_object(
    'denuncias_confirmadas', (select count(*) from minhas where confirmacoes > 0),
    'linhas', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'linha_id', x.linha_id,
            'codigo', l.codigo,
            'nome', l.nome,
            'confirmadas', x.confirmadas
          )
          order by x.confirmadas desc, l.codigo
        )
        from (
          select linha_id, count(*)::int as confirmadas
          from minhas
          where confirmacoes > 0
          group by linha_id
        ) x
        join linhas l on l.id = x.linha_id
      ),
      '[]'::jsonb
    ),
    -- a sequência continua valendo se a última colaboração foi ontem (a pessoa ainda tem hoje)
    'sequencia_atual', coalesce(
      (
        select tamanho
        from sequencias
        where fim >= (now() at time zone 'America/Fortaleza')::date - 1
        order by fim desc
        limit 1
      ),
      0
    ),
    'melhor_sequencia', coalesce((select max(tamanho) from sequencias), 0)
  );
$$ language sql stable
set search_path = public;

revoke all on function meus_selos ()
from
  public,
  anon;

grant execute on function meus_selos () to authenticated;

-- 2. Ranking público de linhas ----------------------------------------------------------------
-- `security definer` porque conta pessoas distintas em `denuncia_autores` (tabela privada); o
-- resultado traz só totais por linha.
create function ranking_linhas_semana (p_limite int default 3) returns table (
  linha_id uuid,
  codigo text,
  nome text,
  zona text,
  denuncias bigint,
  pessoas bigint,
  confirmacoes bigint,
  pendentes bigint
) as $$
  select
    l.id,
    l.codigo,
    l.nome,
    l.zona,
    count(*) as denuncias,
    count(distinct a.user_id) as pessoas,
    coalesce(sum(d.confirmacoes), 0)::bigint as confirmacoes,
    count(*) filter (where d.status = 'pendente') as pendentes
  from denuncias d
  join linhas l on l.id = d.linha_id
  left join denuncia_autores a on a.denuncia_id = d.id
  where d.created_at >= now() - interval '7 days'
  group by l.id, l.codigo, l.nome, l.zona
  having count(distinct a.user_id) >= 2
  order by
    count(distinct a.user_id) desc,
    count(*) desc,
    coalesce(sum(d.confirmacoes), 0) desc,
    l.codigo
  limit greatest(least(coalesce(p_limite, 3), 10), 1);
$$ language sql stable security definer
set search_path = public;

revoke all on function ranking_linhas_semana (int)
from
  public;

grant execute on function ranking_linhas_semana (int) to anon, authenticated;
