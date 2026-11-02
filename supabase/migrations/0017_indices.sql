-- Índices apontados pelo Performance Advisor (lint 0001) e pelo checklist de publicação.
--
-- - `denuncias(created_at desc)`: o app lê "as denúncias dos últimos 30 dias, da mais nova para a
--   mais antiga" a cada abertura; sem índice, isso varre a tabela inteira conforme ela cresce.
-- - `feedbacks(user_id)` e `usuario_linhas(linha_id)`: chaves estrangeiras sem índice. Sem ele, excluir
--   um usuário (ou uma linha) varre a tabela filha inteira para aplicar o `on delete`.
--
-- Não removemos `denuncias_linha_id_idx` nem `denuncias_status_idx`, mesmo "sem uso": com poucas
-- linhas o Postgres prefere varrer a tabela, e eles passam a valer quando ela crescer.

create index if not exists denuncias_created_at_idx on denuncias (created_at desc);

create index if not exists feedbacks_user_id_idx on feedbacks (user_id);

create index if not exists usuario_linhas_linha_id_idx on usuario_linhas (linha_id);
