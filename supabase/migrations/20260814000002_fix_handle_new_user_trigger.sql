-- Camarão Camarada — Corrige handle_new_user() para não engolir erros
-- Migration: fix_handle_new_user_trigger
--
-- A versão em produção deste trigger (editada fora de uma migration
-- rastreada) envolve o INSERT em `profiles` num
-- `EXCEPTION WHEN OTHERS THEN RETURN NEW`, que faz qualquer falha real
-- (ex.: violação de CHECK constraint em `role`) passar silenciosamente,
-- deixando `auth.users` com um `id` sem `profiles` correspondente. A
-- feature de acesso sem senha (CLIENT_PASSWORDLESS_ACCESS) cria usuários
-- via Admin API e depende desse trigger para popular `profiles` de forma
-- confiável — esta migration realinha a função de produção com a
-- definição original da migration inicial, mantendo o
-- `ON CONFLICT (id) DO NOTHING` (idempotência em reexecuções) mas sem
-- engolir erros de verdade.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
