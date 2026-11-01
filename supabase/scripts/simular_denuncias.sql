-- Simulação de denúncias para testar a lista, o mapa e o painel com muitos registros.
-- Rode no SQL Editor do Supabase (ele ignora o RLS). NÃO é uma migração.
--
-- Todas as denúncias simuladas começam com "[SIMULADA]" na descrição, o que permite
-- apagá-las depois com o bloco "LIMPEZA" no final deste arquivo.
-- Atenção: denúncias são públicas; elas aparecerão para todos os usuários até a limpeza.

-- Quantidade de denúncias: troque o 500 abaixo.
insert into
  denuncias (user_id, linha_id, tipo, status, descricao, numero_veiculo, latitude, longitude, created_at)
select
  -- Dono: um admin, se existir; senão qualquer usuário cadastrado.
  (select id from profiles order by (role = 'admin') desc, created_at limit 1),
  -- A referência a g.n força a escolha de uma linha diferente a cada denúncia.
  (select id from linhas where g.n is not null order by random() limit 1),
  (array['quebrado', 'acidente', 'atraso', 'lotacao', 'outro'])[1 + floor(random() * 5)::int],
  case when random() < 0.3 then 'resolvido' else 'pendente' end,
  '[SIMULADA] Denúncia de teste número ' || g.n,
  case when random() < 0.5 then (1000 + floor(random() * 9000))::int::text end,
  -- Em torno de Teresina.
  -5.09 + (random() - 0.5) * 0.14,
  -42.80 + (random() - 0.5) * 0.14,
  -- Espalhadas pelos últimos 30 dias.
  now() - random() * interval '30 days'
from
  generate_series(1, 500) as g (n);

-- LIMPEZA: apaga todas as denúncias simuladas.
-- delete from denuncias where descricao like '[SIMULADA]%';
