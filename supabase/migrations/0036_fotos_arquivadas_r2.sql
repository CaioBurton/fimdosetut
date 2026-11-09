-- Arquivamento das fotos antigas no Cloudflare R2 (ver scripts/arquivar-fotos.mjs).
--
-- O script copia para o R2 as fotos publicadas há mais de N dias, confere a cópia, marca a denúncia
-- com `foto_path = 'r2:<arquivo>'` e só então apaga o arquivo do Supabase Storage. O app monta a
-- URL do R2 quando o caminho começa com `r2:` (VITE_FOTOS_ARQUIVO_URL).
--
-- Esta migration só libera essa marcação:
-- 1. o formato da coluna passa a aceitar o prefixo `r2:`;
-- 2. o gatilho da 0031 (que impede colocar foto sem passar pela fila) deixa a chave `service_role`
--    trocar `<arquivo>` por `r2:<arquivo>` na mesma denúncia, e nada além disso.

-- 1. Formato da coluna.
alter table denuncias
drop constraint if exists denuncias_foto_path_check;

alter table denuncias
add constraint denuncias_foto_path_check check (
  foto_path ~ '^(r2:)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'
);

-- 2. Gatilho: além do admin, o arquivamento (só a troca para `r2:` da mesma foto, só pela
-- `service_role`, que nunca vai para o navegador).
create or replace function proteger_foto_path () returns trigger as $$
begin
  if new.foto_path is not null
    and new.foto_path is distinct from old.foto_path
    and not is_admin ()
    and not (
      coalesce(auth.jwt () ->> 'role', '') = 'service_role'
      and new.foto_path = 'r2:' || old.foto_path
    ) then
    raise exception 'foto precisa de aprovação';
  end if;
  return new;
end;
$$ language plpgsql
set search_path = public;
