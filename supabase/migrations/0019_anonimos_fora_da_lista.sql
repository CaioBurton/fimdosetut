-- Quem denuncia sem cadastro (login anônimo do Supabase Auth) não entra na lista de usuários.
-- A lista do painel admin lê `profiles`; então contas anônimas deixam de ganhar perfil. O perfil
-- nasce quando a pessoa cria a conta de verdade (o e-mail deixa de ser nulo).
-- As denúncias continuam ligadas ao mesmo id (`denuncia_autores`), que não depende de `profiles`.

-- 1. Perfil só para contas com cadastro.
create or replace function handle_new_user () returns trigger as $$
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;
  insert into profiles (id, email) values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer
set search_path = public;

-- 2. Anônima que vira conta (ganha e-mail): cria o perfil agora; se já existir, só atualiza o e-mail.
create or replace function sincronizar_email_perfil () returns trigger as $$
begin
  insert into profiles (id, email) values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer
set search_path = public;

-- 3. Limpa os perfis de anônimos que já existem (conta de verdade tem e-mail e is_anonymous falso).
delete from profiles p
using auth.users u
where u.id = p.id
  and coalesce(u.is_anonymous, false)
  and p.role = 'user';
