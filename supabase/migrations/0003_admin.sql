-- Perfis de usuário com papel (user/admin) e bloqueio (banido).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  banido boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Cria o perfil automaticamente quando um usuário se cadastra.
create function handle_new_user () returns trigger as $$
begin
  insert into profiles (id, email) values (new.id, coalesce(new.email, ''));
  return new;
end;
$$ language plpgsql security definer
set search_path = public;

create trigger on_auth_user_created after insert on auth.users for each row
execute function handle_new_user ();

-- Perfis para quem já estava cadastrado.
insert into profiles (id, email)
select id, coalesce(email, '') from auth.users
on conflict (id) do nothing;

create function is_admin () returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid () and role = 'admin');
$$ language sql security definer stable
set search_path = public;

create function is_banido () returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid () and banido);
$$ language sql security definer stable
set search_path = public;

-- Cada um lê o próprio perfil; admin lê e altera todos. Ninguém altera o próprio papel
-- sem ser admin (não há policy de update para usuários comuns).
create policy "profiles: leitura propria ou admin" on profiles for select using (
  auth.uid () = id
  or is_admin ()
);

create policy "profiles: update admin" on profiles for update using (is_admin ())
with
  check (is_admin ());

-- Denúncias: admin pode alterar e excluir qualquer uma; banido não cria novas.
drop policy "denuncias: insercao autenticada" on denuncias;
drop policy "denuncias: update dono" on denuncias;
drop policy "denuncias: delete dono" on denuncias;

create policy "denuncias: insercao autenticada" on denuncias for insert
with
  check (auth.uid () = user_id and not is_banido ());

create policy "denuncias: update dono ou admin" on denuncias for update using (
  auth.uid () = user_id
  or is_admin ()
);

create policy "denuncias: delete dono ou admin" on denuncias for delete using (
  auth.uid () = user_id
  or is_admin ()
);

-- Exclusão de usuário (remove o login e, em cascata, perfil e denúncias).
create function admin_excluir_usuario (alvo uuid) returns void as $$
begin
  if not is_admin () then
    raise exception 'não autorizado';
  end if;
  if alvo = auth.uid () then
    raise exception 'não é possível excluir a si mesmo';
  end if;
  delete from auth.users where id = alvo;
end;
$$ language plpgsql security definer
set search_path = public;

revoke all on function admin_excluir_usuario (uuid)
from
  public,
  anon;

grant
execute on function admin_excluir_usuario (uuid) to authenticated;

-- Para promover o primeiro admin, rode manualmente no SQL Editor do Supabase:
--   update profiles set role = 'admin' where email = 'seu-email@exemplo.com';
