-- Camarão Camarada — Ownership de parâmetros por conta (lab_admin)
-- Migration: parameter_ownership
--
-- Até aqui, `parameters` era uma tabela global: qualquer lab_admin podia
-- criar, editar ou excluir qualquer parâmetro. Esta migration adiciona
-- dono (created_by) e restringe INSERT/UPDATE/DELETE ao próprio dono,
-- para permitir múltiplas contas de laboratório sem uma afetar a outra.
-- Leitura (SELECT) continua liberada para qualquer usuário autenticado,
-- já que clientes precisam ver os parâmetros referenciados em suas
-- próprias análises independentemente de qual conta os criou.

ALTER TABLE parameters ADD COLUMN created_by UUID REFERENCES profiles(id);

-- Backfill: atribui os parâmetros existentes ao lab_admin mais antigo
-- (hoje só existe uma conta de laboratório em produção).
UPDATE parameters
SET created_by = (
  SELECT id FROM profiles WHERE role = 'lab_admin' ORDER BY created_at ASC LIMIT 1
)
WHERE created_by IS NULL;

ALTER TABLE parameters ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE parameters ALTER COLUMN created_by SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "parameters_lab_admin_all" ON parameters;

CREATE POLICY "parameters_lab_admin_insert" ON parameters
  FOR INSERT WITH CHECK (current_user_role() = 'lab_admin' AND created_by = auth.uid());

CREATE POLICY "parameters_lab_admin_update" ON parameters
  FOR UPDATE USING (current_user_role() = 'lab_admin' AND created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "parameters_lab_admin_delete" ON parameters
  FOR DELETE USING (current_user_role() = 'lab_admin' AND created_by = auth.uid());

-- parameters_authenticated_select (SELECT para qualquer usuário autenticado) permanece inalterada.
