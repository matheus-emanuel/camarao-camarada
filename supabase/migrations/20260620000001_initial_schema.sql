-- Camarão Camarada — Schema Inicial
-- Migration: 001_initial_schema

-- Perfis de usuários (extensão do auth.users do Supabase)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('lab_admin', 'client')),
  full_name   TEXT NOT NULL,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes (fazendeiros)
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id),
  company_name  TEXT,
  document      TEXT,
  address       TEXT,
  city          TEXT,
  state         CHAR(2),
  email         TEXT NOT NULL,
  phone         TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID NOT NULL REFERENCES profiles(id)
);

-- Fazendas
CREATE TABLE farms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  location    TEXT,
  city        TEXT,
  state       CHAR(2),
  area_ha     DECIMAL(10,2),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Viveiros
CREATE TABLE ponds (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id      UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  area_m2      DECIMAL(10,2),
  depth_m      DECIMAL(5,2),
  species      TEXT DEFAULT 'Litopenaeus vannamei',
  system_type  TEXT CHECK (system_type IN ('extensivo', 'semi-intensivo', 'intensivo', 'bioflocos')),
  active       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Parâmetros de análise (configuráveis pelo lab_admin)
CREATE TABLE parameters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  unit           TEXT,
  category       TEXT NOT NULL CHECK (category IN ('campo', 'laboratorio', 'microbiologico', 'contaminantes')),
  ref_min        DECIMAL(15,4),
  ref_max        DECIMAL(15,4),
  description    TEXT,
  method         TEXT,
  active         BOOLEAN DEFAULT TRUE,
  display_order  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Análises laboratoriais
CREATE TABLE analyses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pond_id       UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  collected_at  TIMESTAMPTZ NOT NULL,
  analyzed_at   TIMESTAMPTZ,
  technician    TEXT,
  notes         TEXT,
  has_alerts    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID NOT NULL REFERENCES profiles(id)
);

-- Resultados individuais por parâmetro
CREATE TABLE analysis_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id   UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  parameter_id  UUID NOT NULL REFERENCES parameters(id),
  value         DECIMAL(15,4),
  value_text    TEXT,
  is_alert      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (analysis_id, parameter_id)
);

-- Log de notificações enviadas
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id     UUID REFERENCES analyses(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  type            TEXT NOT NULL CHECK (type IN ('alert', 'report', 'invite')),
  recipient_email TEXT NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  success         BOOLEAN DEFAULT TRUE,
  error_message   TEXT
);

-- Índices para performance
CREATE INDEX idx_farms_client_id ON farms(client_id);
CREATE INDEX idx_ponds_farm_id ON ponds(farm_id);
CREATE INDEX idx_analyses_pond_id ON analyses(pond_id);
CREATE INDEX idx_analyses_collected_at ON analyses(collected_at DESC);
CREATE INDEX idx_analysis_results_analysis_id ON analysis_results(analysis_id);
CREATE INDEX idx_analysis_results_parameter_id ON analysis_results(parameter_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_notifications_analysis_id ON notifications(analysis_id);

-- Trigger: criar perfil automaticamente ao criar usuário no Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Perfil criado com role 'client' por padrão; lab_admin é configurado manualmente
  INSERT INTO profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
