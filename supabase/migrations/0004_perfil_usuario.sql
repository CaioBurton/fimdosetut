-- Dados do perfil do usuário: bairro onde mora, local de trabalho e de estudo.
create table perfis_detalhes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  bairro_moradia text not null default '',
  local_trabalho text not null default '',
  local_estudo text not null default '',
  updated_at timestamptz not null default now()
);

-- Linhas de ônibus que o usuário costuma pegar.
create table usuario_linhas (
  user_id uuid not null references auth.users (id) on delete cascade,
  linha_id uuid not null references linhas (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, linha_id)
);

alter table perfis_detalhes enable row level security;
alter table usuario_linhas enable row level security;

create policy "perfis_detalhes: dono" on perfis_detalhes for all using (auth.uid () = user_id)
with
  check (auth.uid () = user_id);

create policy "usuario_linhas: dono" on usuario_linhas for all using (auth.uid () = user_id)
with
  check (auth.uid () = user_id);
