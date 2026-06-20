-- Camarão Camarada — RLS Policies
-- Migration: 002_rls_policies

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponds             ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

-- Helper: role do usuário atual (cached para performance)
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: client_id do usuário atual
CREATE OR REPLACE FUNCTION current_client_id()
RETURNS UUID AS $$
  SELECT id FROM clients WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ========================
-- profiles
-- ========================
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (id = auth.uid());

-- ========================
-- clients
-- ========================
CREATE POLICY "clients_lab_admin_all" ON clients
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "clients_self_select" ON clients
  FOR SELECT USING (user_id = auth.uid());

-- ========================
-- farms
-- ========================
CREATE POLICY "farms_lab_admin_all" ON farms
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "farms_client_select" ON farms
  FOR SELECT USING (client_id = current_client_id());

-- ========================
-- ponds
-- ========================
CREATE POLICY "ponds_lab_admin_all" ON ponds
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "ponds_client_select" ON ponds
  FOR SELECT USING (
    farm_id IN (
      SELECT id FROM farms WHERE client_id = current_client_id()
    )
  );

-- ========================
-- parameters
-- ========================
CREATE POLICY "parameters_lab_admin_all" ON parameters
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "parameters_authenticated_select" ON parameters
  FOR SELECT USING (auth.role() = 'authenticated');

-- ========================
-- analyses
-- ========================
CREATE POLICY "analyses_lab_admin_all" ON analyses
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "analyses_client_select" ON analyses
  FOR SELECT USING (
    pond_id IN (
      SELECT p.id FROM ponds p
      JOIN farms f ON p.farm_id = f.id
      WHERE f.client_id = current_client_id()
    )
  );

-- ========================
-- analysis_results
-- ========================
CREATE POLICY "results_lab_admin_all" ON analysis_results
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "results_client_select" ON analysis_results
  FOR SELECT USING (
    analysis_id IN (
      SELECT a.id FROM analyses a
      JOIN ponds p ON a.pond_id = p.id
      JOIN farms f ON p.farm_id = f.id
      WHERE f.client_id = current_client_id()
    )
  );

-- ========================
-- notifications
-- ========================
CREATE POLICY "notifications_lab_admin_all" ON notifications
  FOR ALL USING (current_user_role() = 'lab_admin');
