-- Desempenho das policies de RLS (lint 0003_auth_rls_initplan do Supabase Advisor).
--
-- `auth.uid()` direto na policy é reavaliado a cada linha lida. Escrito como `(select auth.uid())`,
-- o Postgres calcula uma vez só por consulta (initplan). A regra de acesso é exatamente a mesma;
-- só muda a forma de escrever. `alter policy` troca a expressão sem apagar a policy, então não há
-- instante sem proteção.

-- profiles
alter policy "profiles: leitura propria ou admin" on profiles using (
  (select auth.uid ()) = id
  or is_admin ()
);

-- perfis_detalhes e usuario_linhas
alter policy "perfis_detalhes: dono" on perfis_detalhes using ((select auth.uid ()) = user_id)
with
  check ((select auth.uid ()) = user_id);

alter policy "usuario_linhas: dono" on usuario_linhas using ((select auth.uid ()) = user_id)
with
  check ((select auth.uid ()) = user_id);

-- feedbacks (policy de insert só aceita WITH CHECK)
alter policy "feedbacks: insercao propria" on feedbacks
with
  check ((select auth.uid ()) = user_id and not is_banido ());

-- denuncia_autores
alter policy "denuncia_autores: dono ou admin" on denuncia_autores using (
  (select auth.uid ()) = user_id
  or is_admin ()
);

-- denuncias (update e delete do dono ou do admin)
alter policy "denuncias: update dono ou admin" on denuncias using (
  is_admin ()
  or exists (
    select 1
    from denuncia_autores a
    where a.denuncia_id = denuncias.id
      and a.user_id = (select auth.uid ())
  )
);

alter policy "denuncias: delete dono ou admin" on denuncias using (
  is_admin ()
  or exists (
    select 1
    from denuncia_autores a
    where a.denuncia_id = denuncias.id
      and a.user_id = (select auth.uid ())
  )
);

-- aceites_documentos
alter policy "aceites: leitura propria ou admin" on aceites_documentos using (
  (select auth.uid ()) = user_id
  or is_admin ()
);

alter policy "aceites: insercao propria" on aceites_documentos
with
  check ((select auth.uid ()) = user_id);

-- denuncia_confirmacoes
alter policy "denuncia_confirmacoes: dono" on denuncia_confirmacoes using ((select auth.uid ()) = user_id);
