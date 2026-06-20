# DEFINE: Camarão Camarada — Portal de Monitoramento da Qualidade da Água

> Portal web para laboratórios de análise de carcinicultura transformarem resultados em informação acionável para fazendeiros, com histórico, gráficos e alertas automáticos.

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | CAMARAO_CAMARADA |
| **Date** | 2026-06-20 |
| **Author** | define-agent |
| **Status** | Ready for Design |
| **Clarity Score** | 15/15 |
| **Source** | BRAINSTORM_CAMARAO_CAMARADA.md |

---

## Problem Statement

Laboratórios de análise de água para carcinicultura comunicam resultados de forma fragmentada (PDFs avulsos, e-mails manuais), sem histórico centralizado nem contexto de evolução temporal. Fazendeiros recebem dados brutos sem saber se um parâmetro está crítico, qual é a tendência do viveiro ou quando agir, o que aumenta o risco de perdas na produção por qualidade da água não monitorada.

---

## Target Users

| Usuário | Papel | Pain Point |
|---------|-------|------------|
| **Técnico do Laboratório** (`lab_admin`) | Registra análises, gerencia cadastros, gera relatórios | Processo manual e fragmentado; sem histórico centralizado; comunicação ao cliente depende de envio manual de PDF |
| **Fazendeiro / Dono de Fazenda** (`client`) | Visualiza resultados de suas fazendas e viveiros | Recebe dados sem contexto histórico; não sabe quando há risco; não consegue monitorar tendências entre análises |

---

## Goals

| Prioridade | Goal |
|------------|------|
| **MUST** | Lab admin consegue cadastrar clientes, fazendas e viveiros |
| **MUST** | Lab admin registra análise com valores dos parâmetros medidos |
| **MUST** | Cliente visualiza histórico de resultados por viveiro |
| **MUST** | Sistema detecta automaticamente parâmetros fora do range e alerta (visual + e-mail) |
| **MUST** | Interface responsiva (desktop e mobile) |
| **MUST** | Deploy 100% gratuito e funcionando em produção |
| **SHOULD** | Gráficos de evolução temporal por parâmetro e por viveiro |
| **SHOULD** | Geração de relatório PDF da análise com 1 clique |
| **COULD** | Comparação lado a lado entre duas análises do mesmo viveiro |

---

## Success Criteria

- [ ] Lab admin cadastra cliente + fazenda + viveiro em menos de 5 minutos no total
- [ ] Lab admin registra análise com múltiplos parâmetros em menos de 3 minutos
- [ ] Sistema detecta e marca automaticamente todos os resultados fora do range no momento do registro
- [ ] E-mail de alerta é enviado ao cliente em menos de 60 segundos após registro de análise com alertas
- [ ] Cliente visualiza histórico completo com no mínimo 12 meses de análises em um único painel
- [ ] Gráfico de evolução renderiza em menos de 2 segundos para séries de até 100 pontos
- [ ] PDF de análise é gerado e disponibilizado para download em menos de 5 segundos
- [ ] Cliente não consegue acessar dados de outro cliente (isolamento por RLS verificado)
- [ ] App carrega em mobile (375px) sem scroll horizontal e com boa legibilidade
- [ ] Custo total de infraestrutura: R$ 0,00/mês no plano gratuito

---

## Acceptance Tests

| ID | Cenário | Dado | Quando | Então |
|----|---------|------|--------|-------|
| AT-001 | Cadastro de cliente | Lab admin autenticado | Preenche formulário de cliente (nome, e-mail, telefone) e salva | Cliente aparece na lista e recebe convite por e-mail para criar senha |
| AT-002 | Cadastro de fazenda | Cliente existente no sistema | Lab admin associa fazenda ao cliente (nome, localização, área) | Fazenda aparece no perfil do cliente |
| AT-003 | Cadastro de viveiro | Fazenda existente | Lab admin cadastra viveiro (nome, área, espécie, sistema) | Viveiro aparece listado na fazenda |
| AT-004 | Registro de análise sem alertas | Viveiro cadastrado | Lab admin registra análise com todos os valores dentro do range | Análise salva, badge verde no histórico, nenhum e-mail enviado |
| AT-005 | Registro de análise com alerta | Viveiro cadastrado; Amônia Total = 1.5 mg/L (ref. máx = 1.0) | Lab admin registra análise com valor fora do range | Resultado marcado em vermelho, campo `is_alert=true`, análise com `has_alerts=true` |
| AT-006 | Envio de e-mail de alerta | Análise com alertas registrada | Sistema processa a análise | E-mail enviado via Resend ao e-mail do cliente dentro de 60s, com lista dos parâmetros em alerta |
| AT-007 | Visualização do histórico pelo cliente | Cliente autenticado com 3 análises no sistema | Acessa painel do viveiro | Vê tabela com datas, status (alerta/normal) e botão para ver detalhes de cada análise |
| AT-008 | Gráfico de evolução | Viveiro com 5+ análises | Cliente seleciona parâmetro "pH" no gráfico do viveiro | Exibe gráfico de linha com pontos no tempo, linhas de referência min/max, destacando pontos em alerta |
| AT-009 | Comparação entre análises | Viveiro com 2+ análises | Cliente seleciona duas datas e clica em "Comparar" | Tabela lado a lado mostrando os valores de cada parâmetro nas duas análises, com delta e indicação de melhora/piora |
| AT-010 | Geração de PDF | Análise existente (com ou sem alertas) | Lab admin ou cliente clica em "Baixar PDF" | PDF gerado com logo, dados do cliente/fazenda/viveiro, tabela de resultados com destaque nos alertas e valores de referência |
| AT-011 | Isolamento de dados (RLS) | Dois clientes cadastrados (ClienteA, ClienteB) | ClienteA tenta acessar URL de fazenda do ClienteB | Recebe erro 403 / página não encontrada; dados do ClienteB não aparecem em nenhuma listagem |
| AT-012 | Configuração de parâmetros | Lab admin autenticado | Acessa "Parâmetros" e adiciona novo parâmetro (nome, unidade, ref. min, ref. max) | Parâmetro aparece disponível no formulário de registro de análise |
| AT-013 | Login e redirecionamento por papel | Usuário com papel `lab_admin` | Faz login | Redirecionado para `/admin/dashboard`; não vê menu "Meus Viveiros" |
| AT-014 | Login e redirecionamento por papel | Usuário com papel `client` | Faz login | Redirecionado para `/portal/dashboard`; não vê menu "Cadastros" ou "Parâmetros" |
| AT-015 | Responsividade mobile | App em produção | Acessa em viewport de 375px (iPhone SE) | Navegação por menu hambúrguer, tabelas com scroll horizontal, gráficos em tamanho legível |

---

## Out of Scope

- Multi-laboratório (SaaS com múltiplos tenants) — arquitetura futura
- Notificações por WhatsApp ou SMS
- Aplicativo mobile nativo (iOS/Android)
- Export para Excel/CSV
- Integração com equipamentos de medição em campo
- Mapas geoespaciais das fazendas
- Internacionalização (i18n) — app em português apenas
- Sistema de cobrança / planos pagos
- Relatórios comparativos de múltiplos viveiros (cross-pond analytics)
- Gestão de estoque de insumos
- Controle de biometria dos camarões

---

## Constraints

| Tipo | Constraint | Impacto |
|------|------------|---------|
| **Custo** | Stack 100% gratuito | Vercel Hobby + Supabase Free + Resend Free; não pode usar serviços pagos |
| **Escala MVP** | 1 laboratório, até 50 clientes | Supabase Free (500MB) é suficiente; sem necessidade de cache ou CDN extra |
| **E-mail** | Resend: 100 e-mails/dia no plano gratuito | Alertas enviados apenas ao e-mail do cliente; sem CC automático em massa |
| **Supabase inatividade** | Projeto pausa após 7 dias sem uso | Configurar ping automático via Vercel Cron Job (grátis) |
| **Segurança** | RLS obrigatório no Supabase | Todas as tabelas de dados devem ter RLS habilitado; sem bypass via `service_role` no frontend |
| **Manutenção** | Código assistido por IA | TypeScript end-to-end; padrões bem documentados; evitar abstrações excessivas |

---

## Technical Context

| Aspecto | Valor | Notas |
|---------|-------|-------|
| **Framework** | Next.js 14 (App Router) + TypeScript | Server Components para dados, Client Components para interatividade |
| **Banco de dados** | Supabase (PostgreSQL 15) | Managed; RLS habilitado; cliente Supabase JS no frontend |
| **Autenticação** | Supabase Auth (email + senha) | Magic link para convite de clientes; JWT para sessão |
| **UI** | shadcn/ui + Tailwind CSS | Componentes acessíveis (a11y); tema customizável |
| **Gráficos** | Recharts | Biblioteca React; suporte a séries temporais e linhas de referência |
| **PDF** | jsPDF + html2canvas | Client-side; captura DOM renderizado como imagem |
| **E-mail** | Resend SDK + React Email | Templates HTML responsivos; trigger via Next.js API Route |
| **Hospedagem** | Vercel (Hobby plan) | Deploy automático via GitHub; Edge Functions para API Routes |
| **Deploy Location** | `/src/app` (App Router) | `/admin/*` para lab_admin; `/portal/*` para client; `/api/*` para API routes |
| **IaC Impact** | None | Supabase e Vercel são plataformas managed; configuração via dashboard e migrations SQL |

---

## Data Model

### Schema Completo

```sql
-- Extensão do Supabase Auth
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
  user_id       UUID REFERENCES profiles(id),     -- NULL até aceitar convite
  company_name  TEXT,
  document      TEXT,                              -- CPF ou CNPJ
  address       TEXT,
  city          TEXT,
  state         TEXT(2),
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
  state       TEXT(2),
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
  value_text    TEXT,                    -- para valores não numéricos (Ausente/Presente)
  is_alert      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (analysis_id, parameter_id)
);

-- Log de notificações enviadas
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id     UUID REFERENCES analyses(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  type            TEXT NOT NULL CHECK (type IN ('alert', 'report')),
  recipient_email TEXT NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  success         BOOLEAN DEFAULT TRUE,
  error_message   TEXT
);
```

### RLS Policies (resumo)

| Tabela | lab_admin | client |
|--------|-----------|--------|
| `profiles` | SELECT/UPDATE próprio | SELECT/UPDATE próprio |
| `clients` | SELECT/INSERT/UPDATE todos | SELECT próprio registro |
| `farms` | SELECT/INSERT/UPDATE todos | SELECT onde `client_id` = seu client |
| `ponds` | SELECT/INSERT/UPDATE todos | SELECT via farms → seu client |
| `parameters` | SELECT/INSERT/UPDATE/DELETE | SELECT (somente leitura) |
| `analyses` | SELECT/INSERT/UPDATE todos | SELECT via ponds → farms → seu client |
| `analysis_results` | SELECT/INSERT/UPDATE todos | SELECT via analyses |
| `notifications` | SELECT/INSERT todos | Sem acesso direto |

### Seed Data — 25 Parâmetros

```sql
INSERT INTO parameters (name, unit, category, ref_min, ref_max, method, display_order) VALUES
  ('Temperatura',              '°C',           'campo',          22.5,  28.8, 'Termômetro digital / Sonda multiparamétrica',              1),
  ('Oxigênio Dissolvido',      'mg/L',         'campo',          5.0,   NULL, 'Oxímetro portátil / Método de Winkler',                    2),
  ('pH',                       NULL,           'campo',          7.5,   8.5,  'pHmetro / Método colorimétrico',                           3),
  ('Salinidade',               'ppt',          'campo',          10.0,  25.0, 'Refratômetro / Condutivímetro',                            4),
  ('Transparência',            'cm',           'campo',          NULL,  NULL, 'Disco de Secchi',                                          5),
  ('ORP',                      'mV',           'campo',          NULL,  NULL, 'Sonda ORP',                                                6),
  ('Condutividade',            'µS/cm',        'campo',          NULL,  NULL, 'Condutivímetro',                                           7),
  ('Alcalinidade',             'mg/L CaCO₃',  'laboratorio',    120.0, 220.0,'Titulação ácido-base',                                     8),
  ('Dureza',                   'mg/L CaCO₃',  'laboratorio',    NULL,  NULL, 'Titulação com EDTA',                                       9),
  ('Amônia Total (TAN)',       'mg/L',         'laboratorio',    NULL,  1.0,  'Colorimetria / Espectrofotometria',                        10),
  ('Amônia Não Ionizada (NH₃)','mg/L',        'laboratorio',    NULL,  NULL, 'Cálculo a partir de TAN, pH e Temperatura',                11),
  ('Nitrito (NO₂⁻)',           'mg/L',         'laboratorio',    NULL,  20.0, 'Colorimetria',                                             12),
  ('Nitrato (NO₃⁻)',           'mg/L',         'laboratorio',    NULL,  200.0,'Espectrofotometria / Colorimetria',                        13),
  ('Nitrogênio Total',         'mg/L',         'laboratorio',    NULL,  NULL, 'Método Kjeldahl',                                          14),
  ('Fosfato (PO₄³⁻)',          'mg/L',         'laboratorio',    NULL,  NULL, 'Colorimetria',                                             15),
  ('Fósforo Total',            'mg/L',         'laboratorio',    NULL,  NULL, 'Digestão química + colorimetria',                          16),
  ('Clorofila-a',              'µg/L',         'laboratorio',    NULL,  NULL, 'Extração em solvente + espectrofotometria',                17),
  ('Sólidos Suspensos Totais', 'mg/L',         'laboratorio',    300.0, 500.0,'Filtração e secagem em estufa',                            18),
  ('DBO',                      'mg/L O₂',      'laboratorio',    NULL,  NULL, 'DBO₅',                                                     19),
  ('DQO',                      'mg/L O₂',      'laboratorio',    NULL,  NULL, 'Digestão química com oxidantes fortes',                    20),
  ('Vibrio spp.',              'UFC/mL',       'microbiologico', NULL,  NULL, 'Cultivo microbiológico / PCR',                             21),
  ('Coliformes',               'NMP/100mL',    'microbiologico', NULL,  NULL, 'Fermentação em tubos múltiplos / Membrana filtrante',      22),
  ('Bactérias Heterotróficas', 'UFC/mL',       'microbiologico', NULL,  NULL, 'Contagem em placas',                                       23),
  ('Metais Pesados',           'variável',     'contaminantes',  NULL,  NULL, 'ICP-OES / ICP-MS / Absorção atômica',                     24),
  ('Resíduos de Agrotóxicos',  'variável',     'contaminantes',  NULL,  NULL, 'Cromatografia GC-MS / LC-MS',                             25);
```

---

## Assumptions

| ID | Assumption | Se Estiver Errada, Impacto | Validado? |
|----|------------|---------------------------|-----------|
| A-001 | Supabase Free Tier (500MB) é suficiente para MVP com 50 clientes e análises semanais | Precisaria de plano pago (~$25/mês) ou migração para Railway | [ ] |
| A-002 | 100 e-mails/dia do Resend cobre os alertas gerados pelo laboratório | Precisaria de upgrade do Resend ou migração para Nodemailer + Gmail SMTP | [ ] |
| A-003 | jsPDF + html2canvas gera PDFs com qualidade suficiente (sem fontes especiais) | Precisaria de biblioteca server-side (Puppeteer) ou serviço externo | [ ] |
| A-004 | Clientes do laboratório têm acesso à internet e e-mail ativo | Canal de comunicação de fallback necessário (WhatsApp, telefone) | [ ] |
| A-005 | Um único usuário `lab_admin` é suficiente para o MVP | Precisaria de roles multi-usuário no laboratório (ex: técnico junior) | [ ] |

---

## Application Routes

### Admin (lab_admin)

| Rota | Descrição |
|------|-----------|
| `/admin/dashboard` | Visão geral: análises recentes, alertas pendentes, contagem de clientes/viveiros |
| `/admin/clients` | Listagem de clientes + botão cadastrar |
| `/admin/clients/[id]` | Perfil do cliente com suas fazendas |
| `/admin/farms/[id]` | Detalhe da fazenda com viveiros |
| `/admin/ponds/[id]` | Detalhe do viveiro com histórico de análises |
| `/admin/analyses/new` | Formulário de nova análise (seleciona viveiro + parâmetros) |
| `/admin/analyses/[id]` | Detalhe de análise com resultados |
| `/admin/parameters` | Gestão dos parâmetros de análise |
| `/admin/settings` | Configurações do laboratório (nome, logo, e-mail remetente) |

### Portal (client)

| Rota | Descrição |
|------|-----------|
| `/portal/dashboard` | Cards com resumo dos viveiros ativos e alertas recentes |
| `/portal/farms` | Minhas fazendas |
| `/portal/farms/[id]` | Detalhe da fazenda com viveiros |
| `/portal/ponds/[id]` | Histórico de análises + gráficos de evolução |
| `/portal/analyses/[id]` | Resultado detalhado de análise (com opção de PDF) |
| `/portal/compare` | Seleção de duas análises do mesmo viveiro para comparação |

### Auth

| Rota | Descrição |
|------|-----------|
| `/login` | Formulário de login (e-mail + senha) |
| `/auth/callback` | Callback do Supabase Auth (magic link / OAuth) |
| `/auth/set-password` | Primeiro acesso do cliente (após convite) |

### API Routes (Next.js)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/analyses` | POST | Registra análise, calcula alertas, dispara e-mail via Resend |
| `/api/pdf/[analysisId]` | GET | Gera e retorna PDF da análise |
| `/api/notifications/test` | POST | Testa envio de e-mail (apenas lab_admin) |

---

## UI/UX Guidelines

- **Paleta de cores:** Tons de azul-oceano e verde-água (identidade aquícola); vermelho para alertas críticos; amarelo para atenção
- **Tipografia:** Inter (Google Fonts, grátis)
- **Ícones:** Lucide React (já incluso no shadcn/ui)
- **Cards de status:**
  - 🟢 Verde: todos os parâmetros dentro do range
  - 🟡 Amarelo: 1-2 parâmetros em alerta
  - 🔴 Vermelho: 3+ parâmetros em alerta ou parâmetro crítico (OD, TAN)
- **Gráficos:** Linha do tempo com pontos clicáveis; linhas tracejadas horizontais para ref_min e ref_max
- **Tabelas responsivas:** Cards empilhados em mobile (< 768px)

---

## Clarity Score Breakdown

| Elemento | Score (0-3) | Justificativa |
|----------|-------------|---------------|
| Problem | 3 | Dor específica, impacto mensurável, dois lados do problema documentados |
| Users | 3 | Dois perfis com papéis e pain points explícitos |
| Goals | 3 | Priorizado com MUST/SHOULD/COULD, sem ambiguidade |
| Success | 3 | 10 critérios mensuráveis com números e tempo |
| Scope | 3 | 11 itens explicitamente fora de escopo listados |
| **Total** | **15/15** | |

---

## Open Questions

Nenhuma questão pendente — o documento de brainstorm cobriu todos os pontos críticos.

**Pontos a confirmar durante o Design:**
1. Nome e logotipo do laboratório para personalização do app (placeholder no MVP)
2. Formato do número de documento do cliente (CPF vs CNPJ — suportar ambos)
3. Definir parâmetros "críticos" que geram alerta de maior urgência no e-mail (sugestão: OD < 5 mg/L, TAN > 1 mg/L)

---

## Revision History

| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-06-20 | define-agent | Versão inicial a partir de BRAINSTORM_CAMARAO_CAMARADA.md |

---

## Next Step

**Ready for:** `/design .claude/sdd/features/DEFINE_CAMARAO_CAMARADA.md`
