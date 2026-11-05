-- Reclassifica denúncias antigas do tipo 'outro' nos tipos criados na migration 0025, pelas
-- palavras da descrição. Só mexe em quem ainda é 'outro'; o que não casar com nenhuma regra fica
-- como está. A ordem dos casos importa (vale o primeiro que casar).
-- O gatilho de updated_at é desligado para não mudar a data de atualização das denúncias.
alter table denuncias disable trigger denuncias_set_updated_at;

update denuncias
set tipo = case
  when descricao ~* '(gps|rastrea|rastread|letreiro)' then 'gps'
  when descricao ~* '(n[ãa]o (passou|passa|saiu)|\mn saiu|sem [ôo]nibus|poucos [ôo]nibus)' then 'nao_passou'
  when descricao ~* '(ar[ -]condicionado|sauna|forno|climatiza)' then 'ar_condicionado'
  when descricao ~* 'porta.*quebrad' then 'quebrado'
  when descricao ~* '(antes do hor[áa]rio|atrasa)' then 'atraso'
end
where tipo = 'outro'
  and descricao ~* '(gps|rastrea|rastread|letreiro|n[ãa]o (passou|passa|saiu)|\mn saiu|sem [ôo]nibus|poucos [ôo]nibus|ar[ -]condicionado|sauna|forno|climatiza|porta.*quebrad|antes do hor[áa]rio|atrasa)';

alter table denuncias enable trigger denuncias_set_updated_at;
