-- Registro de aceite da Política de Privacidade e dos Termos de Uso (LGPD, art. 8º, §2º: cabe ao
-- controlador provar o consentimento). A data é a do servidor, e não a que o navegador informa.
create table aceites_documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  versao text not null,
  aceito_em timestamptz not null default now(),
  unique (user_id, versao)
);

alter table aceites_documentos enable row level security;

-- Cada pessoa vê os próprios aceites (o admin vê todos) e registra só o seu.
create policy "aceites: leitura propria ou admin" on aceites_documentos for select using (
  auth.uid () = user_id
  or is_admin ()
);

create policy "aceites: insercao propria" on aceites_documentos for insert
with
  check (auth.uid () = user_id);

-- Quem criou a conta com o aceite no cadastro (metadado `aceite_documentos`) passa a ter o
-- registro no servidor. Contas antigas, sem aceite, ficam de fora e são perguntadas no app.
insert into
  aceites_documentos (user_id, versao, aceito_em)
select
  id,
  raw_user_meta_data ->> 'aceite_documentos',
  created_at
from
  auth.users
where
  coalesce(raw_user_meta_data ->> 'aceite_documentos', '') <> ''
on conflict (user_id, versao) do nothing;

-- Contas novas: grava o aceite informado no cadastro.
create function registrar_aceite_cadastro () returns trigger as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'aceite_documentos', '') <> '' then
    insert into aceites_documentos (user_id, versao)
    values (new.id, new.raw_user_meta_data ->> 'aceite_documentos')
    on conflict (user_id, versao) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer
set search_path = public;

create trigger on_auth_user_created_aceite after insert on auth.users for each row
execute function registrar_aceite_cadastro ();

-- A cópia dos dados da pessoa passa a incluir os aceites registrados.
create or replace function exportar_meus_dados () returns jsonb as $$
  select jsonb_build_object(
    'gerado_em', now(),
    'conta', (
      select jsonb_build_object(
        'id', u.id,
        'email', u.email,
        'nome', u.raw_user_meta_data ->> 'nome',
        'criada_em', p.created_at,
        'papel', p.role,
        'bloqueada', p.banido,
        'aceite_documentos', u.raw_user_meta_data ->> 'aceite_documentos',
        'aceite_em', u.raw_user_meta_data ->> 'aceite_em'
      )
      from auth.users u
      join profiles p on p.id = u.id
      where u.id = auth.uid ()
    ),
    'aceites', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('versao', a.versao, 'aceito_em', a.aceito_em)
          order by a.aceito_em desc
        )
        from aceites_documentos a
        where a.user_id = auth.uid ()
      ),
      '[]'::jsonb
    ),
    'perfil', (
      select to_jsonb (d) - 'user_id'
      from perfis_detalhes d
      where d.user_id = auth.uid ()
    ),
    'linhas_do_perfil', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'codigo', l.codigo,
            'nome', l.nome,
            'zona', l.zona,
            'adicionada_em', ul.created_at
          )
          order by l.codigo
        )
        from usuario_linhas ul
        join linhas l on l.id = ul.linha_id
        where ul.user_id = auth.uid ()
      ),
      '[]'::jsonb
    ),
    'denuncias', coalesce(
      (
        select jsonb_agg(to_jsonb (d) order by d.created_at desc)
        from denuncias d
        join denuncia_autores a on a.denuncia_id = d.id
        where a.user_id = auth.uid ()
      ),
      '[]'::jsonb
    ),
    'feedbacks', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('tipo', f.tipo, 'mensagem', f.mensagem, 'enviado_em', f.created_at)
          order by f.created_at desc
        )
        from feedbacks f
        where f.user_id = auth.uid ()
      ),
      '[]'::jsonb
    )
  );
$$ language sql stable security definer
set search_path = public;
