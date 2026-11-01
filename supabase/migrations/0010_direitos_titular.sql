-- LGPD (art. 18): a própria pessoa baixa uma cópia dos seus dados e exclui a sua conta.

-- Cópia dos dados pessoais de quem está logado, em JSON (portabilidade e acesso).
-- Roda com permissão elevada só para ler o e-mail e os metadados da conta; tudo é filtrado por
-- `auth.uid()`, então cada pessoa só recebe os próprios dados.
create function exportar_meus_dados () returns jsonb as $$
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

revoke all on function exportar_meus_dados ()
from
  public,
  anon;

grant
execute on function exportar_meus_dados () to authenticated;

-- Exclusão da própria conta: apaga o login, o perfil, as linhas cadastradas, a autoria e as
-- denúncias da pessoa. Mensagens de feedback ficam sem identificação (user_id vira null).
-- O único administrador não pode se excluir, para o app não ficar sem admin.
create function excluir_minha_conta () returns void as $$
declare
  eu uuid := auth.uid ();
begin
  if eu is null then
    raise exception 'não autenticado';
  end if;

  if is_admin ()
  and not exists (
    select 1
    from profiles
    where role = 'admin'
      and id <> eu
  ) then
    raise exception 'único administrador';
  end if;

  delete from denuncias
  where id in (select denuncia_id from denuncia_autores where user_id = eu);

  delete from auth.users where id = eu;
end;
$$ language plpgsql security definer
set search_path = public;

revoke all on function excluir_minha_conta ()
from
  public,
  anon;

grant
execute on function excluir_minha_conta () to authenticated;
