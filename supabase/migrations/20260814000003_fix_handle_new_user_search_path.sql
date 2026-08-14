-- Camarão Camarada — Corrige search_path ausente em handle_new_user()
-- Migration: fix_handle_new_user_search_path
--
-- Causa raiz do AT-001 (ver DIAGNOSIS_AT001_CREATEUSER_FAILURE.md em
-- .claude/sdd/reports/): handle_new_user() é SECURITY DEFINER mas nunca
-- fixou `search_path`, então herda o search_path da SESSÃO que a chama —
-- não o do dono da function. Quem insere em auth.users é sempre a role
-- `supabase_auth_admin`, cujo search_path é travado em `auth` (hardening
-- padrão da Supabase, não pode ser alterado nem por `postgres` via SET
-- ROLE). Com isso, a referência não qualificada `profiles` dentro da
-- function nunca resolvia para `public.profiles` — toda vez que o
-- trigger disparava, ele lançava `relation "profiles" does not exist`.
--
-- A versão antiga do trigger (antes de 20260814000002) escondia esse
-- erro com `EXCEPTION WHEN OTHERS THEN RETURN NEW`, então o INSERT em
-- auth.users "funcionava" e o profile correspondente simplesmente nunca
-- era criado. A migration anterior removeu esse swallow (correto — não
-- se deve esconder erros de verdade), o que fez o mesmo erro, que
-- sempre existiu, passar a propagar e abortar a criação do usuário
-- inteira — exatamente o sintoma "Database error creating new user" em
-- QUALQUER payload, reportado no AT-001.
--
-- A correção qualifica a tabela como `public.profiles` e fixa
-- `search_path = ''`, seguindo o padrão recomendado pela própria
-- Supabase para funções SECURITY DEFINER chamadas em contexto de auth.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
