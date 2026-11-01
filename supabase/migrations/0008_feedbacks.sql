-- Feedback dos usuários sobre o app: sugestões, problemas e elogios.
create table feedbacks (
  id uuid primary key default gen_random_uuid(),
  -- Referencia profiles para o admin ver o e-mail de quem enviou; vira null se a conta for apagada.
  user_id uuid references profiles (id) on delete set null,
  tipo text not null check (tipo in ('sugestao', 'problema', 'elogio')),
  mensagem text not null check (char_length(btrim(mensagem)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index feedbacks_created_at_idx on feedbacks (created_at desc);

alter table feedbacks enable row level security;

-- Quem está logado (e não foi bloqueado) envia feedback em seu próprio nome.
create policy "feedbacks: insercao propria" on feedbacks for insert
with
  check (auth.uid () = user_id and not is_banido ());

-- Só admin lê e apaga.
create policy "feedbacks: leitura admin" on feedbacks for select using (is_admin ());

create policy "feedbacks: delete admin" on feedbacks for delete using (is_admin ());
