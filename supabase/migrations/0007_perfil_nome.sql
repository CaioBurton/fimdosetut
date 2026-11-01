-- Nome da pessoa, mostrado no perfil no lugar do e-mail (editável pelo próprio usuário).
-- As policies da tabela (0004) já restringem leitura e escrita ao dono.
alter table perfis_detalhes add column nome text not null default '';
