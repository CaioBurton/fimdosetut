create table linhas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  nome text not null,
  zona text not null check (zona in ('norte', 'sul', 'leste', 'sudeste', 'outras'))
);

create table denuncias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  linha_id uuid not null references linhas (id),
  tipo text not null check (
    tipo in (
      'quebrado',
      'acidente',
      'atraso',
      'lotacao',
      'outro'
    )
  ),
  status text not null default 'pendente' check (status in ('pendente', 'resolvido')),
  descricao text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index denuncias_linha_id_idx on denuncias (linha_id);
create index denuncias_status_idx on denuncias (status);

alter table linhas enable row level security;
alter table denuncias enable row level security;

create policy "linhas: leitura publica" on linhas for select using (true);

create policy "denuncias: leitura publica" on denuncias for select using (true);

create policy "denuncias: insercao autenticada" on denuncias for insert
with
  check (auth.uid () = user_id);

create policy "denuncias: update dono" on denuncias for update using (auth.uid () = user_id);

create policy "denuncias: delete dono" on denuncias for delete using (auth.uid () = user_id);

create function set_updated_at () returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger denuncias_set_updated_at before update on denuncias for each row
execute function set_updated_at ();

alter publication supabase_realtime add table denuncias;
