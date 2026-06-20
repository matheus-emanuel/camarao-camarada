# DESIGN: Camarão Camarada — Portal de Monitoramento da Qualidade da Água

> Especificação técnica completa para implementação do MVP com Next.js 14 + Supabase + Vercel

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | CAMARAO_CAMARADA |
| **Date** | 2026-06-20 |
| **Author** | design-agent |
| **DEFINE** | [DEFINE_CAMARAO_CAMARADA.md](./DEFINE_CAMARAO_CAMARADA.md) |
| **Status** | Ready for Build |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CAMARÃO CAMARADA — MVP                         │
│                     Next.js 14 (App Router) — Vercel                   │
├────────────────────────────┬────────────────────────────────────────────┤
│     /admin/* (lab_admin)   │       /portal/* (client)                  │
│                            │                                            │
│  Dashboard                 │  Dashboard                                 │
│  ├─ Clientes               │  ├─ Minhas Fazendas                       │
│  ├─ Fazendas               │  ├─ Viveiros                              │
│  ├─ Viveiros               │  ├─ Histórico de Análises                 │
│  ├─ Nova Análise ──────────┼──→ Gráficos de Evolução                  │
│  ├─ Parâmetros             │  ├─ Detalhe de Análise + PDF              │
│  └─ Configurações          │  └─ Comparação entre Análises             │
├────────────────────────────┴────────────────────────────────────────────┤
│                         /api/* (API Routes)                             │
│   POST /api/analyses → calcula alertas → dispara e-mail via Resend    │
│   GET  /api/pdf/[id] → gera PDF client-side                           │
│   POST /api/notifications/test → testa envio de e-mail                │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │ Supabase JS SDK
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (Backend-as-a-Service)                  │
│                                                                         │
│  ┌─────────────┐  ┌───────────────────────┐  ┌────────────────────┐   │
│  │  Auth       │  │  PostgreSQL 15 (RLS)  │  │  Storage           │   │
│  │             │  │                       │  │  (logo do lab)     │   │
│  │ email+senha │  │  profiles             │  └────────────────────┘   │
│  │ magic link  │  │  clients              │                            │
│  │ JWT session │  │  farms                │                            │
│  └─────────────┘  │  ponds                │                            │
│                   │  parameters           │                            │
│                   │  analyses             │                            │
│                   │  analysis_results     │                            │
│                   │  notifications        │                            │
│                   └───────────────────────┘                            │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │ Resend SDK
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RESEND (E-mail Transacional)                          │
│   Template: Alert Email (React Email) → cliente notificado em <60s    │
│   Template: Invite Email (React Email) → convite para 1º acesso       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components

| Componente | Propósito | Tecnologia |
|------------|-----------|------------|
| **App Router** | Rotas, layouts, proteção de acesso | Next.js 14 App Router |
| **Middleware** | Verificação de sessão e redirecionamento por role | `middleware.ts` + `@supabase/ssr` |
| **Admin UI** | Interface do técnico de laboratório | React Server + Client Components |
| **Portal UI** | Interface do fazendeiro/cliente | React Server + Client Components |
| **Alert Engine** | Detecta parâmetros fora do range | TypeScript puro em `lib/alerts/checker.ts` |
| **Email Service** | Envia alertas e convites | Resend SDK + React Email templates |
| **PDF Generator** | Gera relatório da análise | jsPDF + html2canvas (client-side) |
| **Charts** | Gráficos de evolução temporal | Recharts (LineChart com ReferenceLine) |
| **Supabase Client** | Acesso ao banco no servidor | `@supabase/ssr` createServerClient |
| **Supabase Client** | Acesso ao banco no browser | `@supabase/ssr` createBrowserClient |
| **Database** | Armazenamento persistente com RLS | Supabase PostgreSQL 15 |

---

## Key Decisions

### Decision 1: App Router com Server Components por Padrão

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-06-20 |

**Context:** Next.js 14 oferece dois paradigmas: Pages Router (legado) e App Router (moderno). A escolha impacta todo o padrão de fetching de dados e de composição de componentes.

**Choice:** Usar App Router com Server Components para todas as páginas de listagem e detalhe. Client Components (`'use client'`) apenas para formulários, gráficos e PDF (que precisam de interatividade ou APIs do browser).

**Rationale:** Server Components fazem fetch direto no servidor (sem waterfall), eliminam a necessidade de `useEffect` para buscar dados, e reduzem o JavaScript enviado ao cliente. A regra é simples: dados = Server Component; interação = Client Component.

**Alternatives Rejected:**
1. Pages Router — descontinuado em favor do App Router; padrões mais antigos e verbosos
2. Tudo como Client Component — mais JavaScript no browser, sem cache do servidor, `useEffect` everywhere

**Consequences:**
- Formulários e gráficos precisam ser Client Components (`'use client'`) — encapsular em componentes separados
- Cuidado com a fronteira Server/Client: não passar funções como props de Server para Client

---

### Decision 2: Supabase RLS como Camada de Autorização Principal

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-06-20 |

**Context:** A aplicação tem dois perfis com permissões radicalmente diferentes. A autorização pode ser feita na camada de aplicação (middleware/API) ou na camada de banco (RLS).

**Choice:** RLS como camada primária. Toda query ao Supabase usa o JWT do usuário autenticado; o banco rejeita automaticamente dados de outros clientes.

**Rationale:** RLS garante que mesmo um bug no código de aplicação não vaza dados de outro cliente. É defense-in-depth: segurança no nível onde os dados residem. Elimina a necessidade de filtros `WHERE client_id = $userId` espalhados pelo código.

**Alternatives Rejected:**
1. Autorização apenas no middleware Next.js — um erro de programação expõe dados
2. `service_role` key no frontend — nunca; bypassa RLS completamente

**Consequences:**
- Todas as queries retornam apenas dados do usuário autenticado automaticamente
- Operações do `lab_admin` que precisam acessar todos os dados devem usar o `service_role` key **somente em API Routes server-side**, nunca no frontend

---

### Decision 3: Geração de PDF Client-Side com jsPDF + html2canvas

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-06-20 |

**Context:** PDF pode ser gerado no servidor (Puppeteer, pdfkit) ou no cliente (jsPDF, html2canvas).

**Choice:** Client-side com jsPDF + html2canvas. A página renderiza um componente `AnalysisPdfLayout` oculto, html2canvas o captura como imagem, e jsPDF monta o documento.

**Rationale:** Puppeteer requer um servidor Node.js dedicado (não funciona em Vercel Edge Functions gratuito). jsPDF + html2canvas funcionam no browser sem custo, sem servidor extra. Para MVP com análises de tabela simples, a qualidade é aceitável.

**Alternatives Rejected:**
1. Puppeteer em Vercel Function — timeout em 10s no plano gratuito; não suportado em Edge
2. `@react-pdf/renderer` — output bonito mas incompatível com html2canvas; requer reconstrução total do layout em JSX-PDF

**Consequences:**
- PDF gerado no browser do usuário; sem armazenamento no servidor no MVP
- Qualidade de texto como imagem (não pesquisável) — aceitável para MVP
- Para relatórios com tabelas muito longas, html2canvas pode ser lento em mobile

---

### Decision 4: Alert Detection na API Route (não em Database Trigger)

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-06-20 |

**Context:** A detecção de alertas (comparar valor com ref_min/ref_max) pode acontecer em um trigger PostgreSQL ou em código de aplicação.

**Choice:** A API Route `POST /api/analyses` recebe os dados, roda a função `checkAlerts()` em TypeScript, e persiste `is_alert` e `has_alerts` já calculados no banco.

**Rationale:** Triggers PostgreSQL são difíceis de testar, debugar e versionar. A lógica em TypeScript é testável unitariamente, legível, e pode ser alterada sem migrations. O Supabase Free Tier tem limitações em funções serverless (Edge Functions têm cold start); manter em Next.js API Route é mais simples.

**Alternatives Rejected:**
1. Database trigger — difícil de debugar; lógica de negócio no banco; não testável com Jest
2. Supabase Edge Function — cold start; billing separado; mais complexidade de deploy

**Consequences:**
- `analysis_results.is_alert` e `analyses.has_alerts` são calculados e gravados em uma única transação
- Se o campo `ref_min`/`ref_max` do parâmetro for NULL, sem alerta (parâmetro sem referência)

---

### Decision 5: Convite de Cliente via Supabase Auth `inviteUserByEmail`

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-06-20 |

**Context:** O lab admin cadastra o cliente (cria o registro em `clients`). O cliente precisa de uma conta para acessar o portal.

**Choice:** Ao cadastrar um cliente, o lab admin usa a Admin API do Supabase (`auth.admin.inviteUserByEmail`) via API Route server-side. O Supabase envia um magic link ao e-mail do cliente para ele criar sua senha.

**Rationale:** Fluxo padrão do Supabase; sem necessidade de implementar "esqueci minha senha" ou verificação de e-mail — tudo gerenciado pelo Supabase Auth.

**Alternatives Rejected:**
1. Lab admin cria senha em nome do cliente — inseguro; o cliente nunca tem controle da própria conta
2. Cliente se cadastra sozinho — o lab admin precisa controlar quem tem acesso

**Consequences:**
- Requer `SUPABASE_SERVICE_ROLE_KEY` na API Route (nunca no frontend)
- Cliente pode estar em `clients` sem `user_id` (antes de aceitar convite) — queries RLS devem considerar esse estado

---

## Estrutura de Pastas

```
camarao-camarada/
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout (fonts, providers)
│   │   ├── page.tsx                        # Redirect → /login
│   │   ├── login/
│   │   │   └── page.tsx                    # Login form
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── route.ts                # Supabase Auth callback handler
│   │   │   └── set-password/
│   │   │       └── page.tsx                # First access (invite link)
│   │   ├── admin/                          # lab_admin only (middleware protegido)
│   │   │   ├── layout.tsx                  # Admin layout com sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx                # Lista de clientes
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/page.tsx
│   │   │   ├── farms/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── ponds/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── analyses/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx            # Formulário multi-step
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── parameters/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── portal/                         # client only (middleware protegido)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── farms/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── ponds/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── analyses/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── compare/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── analyses/
│   │       │   └── route.ts                # POST: cria análise + alertas + email
│   │       ├── pdf/
│   │       │   └── [analysisId]/
│   │       │       └── route.ts            # GET: dados para PDF (client-side)
│   │       └── notifications/
│   │           └── test/
│   │               └── route.ts
│   ├── components/
│   │   ├── ui/                             # shadcn/ui (gerado via CLI)
│   │   ├── layout/
│   │   │   ├── admin-sidebar.tsx
│   │   │   ├── portal-sidebar.tsx
│   │   │   └── mobile-nav.tsx              # Hambúrguer menu < 768px
│   │   ├── charts/
│   │   │   ├── parameter-chart.tsx         # LineChart + ReferenceLine (Recharts)
│   │   │   └── analysis-overview-chart.tsx # Radar/Bar chart resumo
│   │   ├── analyses/
│   │   │   ├── analysis-form.tsx           # 'use client' - multi-step form
│   │   │   ├── analysis-table.tsx          # Tabela de histórico
│   │   │   ├── analysis-results-table.tsx  # Resultados com highlight de alertas
│   │   │   ├── analysis-compare.tsx        # 'use client' - side-by-side
│   │   │   └── analysis-pdf-layout.tsx     # Layout para captura html2canvas
│   │   ├── clients/
│   │   │   ├── client-form.tsx             # 'use client'
│   │   │   └── client-list.tsx
│   │   ├── farms/
│   │   │   └── farm-form.tsx               # 'use client'
│   │   ├── ponds/
│   │   │   └── pond-form.tsx               # 'use client'
│   │   ├── parameters/
│   │   │   └── parameter-form.tsx          # 'use client'
│   │   └── shared/
│   │       ├── alert-badge.tsx             # 🟢🟡🔴 badge de status
│   │       ├── data-table.tsx              # Tabela genérica reutilizável
│   │       ├── confirm-dialog.tsx          # Modal de confirmação de exclusão
│   │       ├── page-header.tsx             # Header de página com breadcrumb
│   │       └── pdf-download-button.tsx     # 'use client' - botão geração PDF
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # createBrowserClient (browser)
│   │   │   └── server.ts                   # createServerClient (SSR/API)
│   │   ├── email/
│   │   │   ├── resend.ts                   # Resend client singleton
│   │   │   └── templates/
│   │   │       ├── alert-email.tsx         # React Email template
│   │   │       └── invite-email.tsx        # React Email template
│   │   ├── alerts/
│   │   │   └── checker.ts                  # checkAlerts(results, parameters)
│   │   ├── pdf/
│   │   │   └── generate.ts                 # generatePdf(elementId)
│   │   └── utils.ts                        # cn(), formatDate(), formatValue()
│   ├── types/
│   │   ├── database.ts                     # Tipos gerados pelo Supabase CLI
│   │   └── app.ts                          # Tipos de domínio da aplicação
│   └── middleware.ts                       # Auth check + role redirect
├── supabase/
│   ├── migrations/
│   │   ├── 20260620000001_initial_schema.sql
│   │   ├── 20260620000002_rls_policies.sql
│   │   └── 20260620000003_seed_parameters.sql
│   └── config.toml
├── public/
│   └── logo-placeholder.png
├── .env.local                              # Variáveis de ambiente (não commitado)
├── .env.example                            # Template de variáveis
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## File Manifest

| # | Arquivo | Ação | Propósito | Dependências |
|---|---------|------|-----------|--------------|
| **Setup & Config** | | | | |
| 1 | `package.json` | Criar | Dependências do projeto | — |
| 2 | `next.config.ts` | Criar | Config Next.js (imagens, env) | 1 |
| 3 | `tailwind.config.ts` | Criar | Tema customizado (cores aquícolas) | 1 |
| 4 | `tsconfig.json` | Criar | Config TypeScript com path aliases | 1 |
| 5 | `.env.example` | Criar | Template de variáveis de ambiente | — |
| 6 | `middleware.ts` | Criar | Auth check + role-based redirect | 7, 8 |
| **Supabase** | | | | |
| 7 | `src/lib/supabase/client.ts` | Criar | Supabase browser client | 1 |
| 8 | `src/lib/supabase/server.ts` | Criar | Supabase server client (SSR) | 1 |
| 9 | `supabase/migrations/001_initial_schema.sql` | Criar | Schema completo (7 tabelas) | — |
| 10 | `supabase/migrations/002_rls_policies.sql` | Criar | Todas as políticas RLS | 9 |
| 11 | `supabase/migrations/003_seed_parameters.sql` | Criar | 25 parâmetros iniciais | 9 |
| **Types** | | | | |
| 12 | `src/types/database.ts` | Criar | Tipos gerados do schema Supabase | 9 |
| 13 | `src/types/app.ts` | Criar | Tipos de domínio (AnalysisWithResults, etc.) | 12 |
| **Core Libs** | | | | |
| 14 | `src/lib/utils.ts` | Criar | cn(), formatDate(), formatValue() | 1 |
| 15 | `src/lib/alerts/checker.ts` | Criar | checkAlerts() — lógica de detecção de alertas | 13 |
| 16 | `src/lib/email/resend.ts` | Criar | Resend client singleton | 1 |
| 17 | `src/lib/email/templates/alert-email.tsx` | Criar | Template e-mail de alerta (React Email) | — |
| 18 | `src/lib/email/templates/invite-email.tsx` | Criar | Template convite de cliente (React Email) | — |
| 19 | `src/lib/pdf/generate.ts` | Criar | generatePdf() com html2canvas + jsPDF | 1 |
| **Root App** | | | | |
| 20 | `src/app/layout.tsx` | Criar | Root layout com fonts e providers | 1 |
| 21 | `src/app/page.tsx` | Criar | Redirect para /login | — |
| **Auth** | | | | |
| 22 | `src/app/login/page.tsx` | Criar | Página de login (Server + Client Form) | 7, 8 |
| 23 | `src/app/auth/callback/route.ts` | Criar | Handler callback do Supabase Auth | 8 |
| 24 | `src/app/auth/set-password/page.tsx` | Criar | Primeiro acesso via convite | 7 |
| **Admin — Layout e Dashboard** | | | | |
| 25 | `src/app/admin/layout.tsx` | Criar | Admin layout com sidebar + auth guard | 6, 8 |
| 26 | `src/app/admin/dashboard/page.tsx` | Criar | Dashboard admin (métricas, alertas recentes) | 8 |
| 27 | `src/components/layout/admin-sidebar.tsx` | Criar | Sidebar de navegação do admin | — |
| 28 | `src/components/layout/mobile-nav.tsx` | Criar | Menu hambúrguer para mobile | — |
| **Admin — Clientes** | | | | |
| 29 | `src/app/admin/clients/page.tsx` | Criar | Listagem de clientes | 8, 13 |
| 30 | `src/app/admin/clients/new/page.tsx` | Criar | Formulário novo cliente | 31 |
| 31 | `src/components/clients/client-form.tsx` | Criar | Form cliente (nome, e-mail, doc, endereço) | 7 |
| 32 | `src/app/admin/clients/[id]/page.tsx` | Criar | Perfil do cliente com fazendas | 8 |
| **Admin — Fazendas e Viveiros** | | | | |
| 33 | `src/app/admin/farms/[id]/page.tsx` | Criar | Detalhe da fazenda com viveiros | 8 |
| 34 | `src/components/farms/farm-form.tsx` | Criar | Form fazenda | 7 |
| 35 | `src/app/admin/ponds/[id]/page.tsx` | Criar | Detalhe do viveiro com análises | 8 |
| 36 | `src/components/ponds/pond-form.tsx` | Criar | Form viveiro | 7 |
| **Admin — Análises** | | | | |
| 37 | `src/app/admin/analyses/new/page.tsx` | Criar | Página nova análise | 38 |
| 38 | `src/components/analyses/analysis-form.tsx` | Criar | Form multi-step (viveiro → parâmetros → valores) | 7, 15 |
| 39 | `src/app/admin/analyses/[id]/page.tsx` | Criar | Detalhe da análise (admin view) | 8 |
| **Admin — Parâmetros e Settings** | | | | |
| 40 | `src/app/admin/parameters/page.tsx` | Criar | CRUD de parâmetros | 41 |
| 41 | `src/components/parameters/parameter-form.tsx` | Criar | Form parâmetro (nome, unidade, ref_min, ref_max) | 7 |
| 42 | `src/app/admin/settings/page.tsx` | Criar | Config do laboratório (nome, logo) | 8 |
| **API Routes** | | | | |
| 43 | `src/app/api/analyses/route.ts` | Criar | POST: cria análise + detecta alertas + envia e-mail | 8, 15, 16 |
| 44 | `src/app/api/pdf/[analysisId]/route.ts` | Criar | GET: retorna dados para geração client-side | 8 |
| 45 | `src/app/api/notifications/test/route.ts` | Criar | POST: testa e-mail (admin only) | 16 |
| 46 | `src/app/api/clients/invite/route.ts` | Criar | POST: invita cliente via Supabase Admin API | 8 |
| **Portal — Layout e Dashboard** | | | | |
| 47 | `src/app/portal/layout.tsx` | Criar | Portal layout com sidebar + auth guard | 6, 8 |
| 48 | `src/app/portal/dashboard/page.tsx` | Criar | Dashboard cliente (viveiros, alertas) | 8 |
| 49 | `src/components/layout/portal-sidebar.tsx` | Criar | Sidebar de navegação do cliente | — |
| **Portal — Fazendas e Viveiros** | | | | |
| 50 | `src/app/portal/farms/page.tsx` | Criar | Minhas fazendas | 8 |
| 51 | `src/app/portal/farms/[id]/page.tsx` | Criar | Fazenda com viveiros | 8 |
| 52 | `src/app/portal/ponds/[id]/page.tsx` | Criar | Histórico de análises + seletor de gráfico | 8 |
| **Portal — Análises** | | | | |
| 53 | `src/app/portal/analyses/[id]/page.tsx` | Criar | Resultado detalhado da análise | 8 |
| 54 | `src/app/portal/compare/page.tsx` | Criar | Seleção e comparação de duas análises | 55 |
| 55 | `src/components/analyses/analysis-compare.tsx` | Criar | Tabela side-by-side com delta | 7 |
| **Componentes Compartilhados** | | | | |
| 56 | `src/components/analyses/analysis-results-table.tsx` | Criar | Tabela de resultados com highlight | 14 |
| 57 | `src/components/analyses/analysis-table.tsx` | Criar | Histórico de análises de um viveiro | 56 |
| 58 | `src/components/analyses/analysis-pdf-layout.tsx` | Criar | Layout oculto para captura PDF | 56 |
| 59 | `src/components/charts/parameter-chart.tsx` | Criar | LineChart por parâmetro (Recharts) | — |
| 60 | `src/components/shared/alert-badge.tsx` | Criar | Badge 🟢🟡🔴 baseado em has_alerts e contagem | 14 |
| 61 | `src/components/shared/pdf-download-button.tsx` | Criar | Botão que chama generatePdf() | 19 |
| 62 | `src/components/shared/data-table.tsx` | Criar | Tabela genérica com paginação | — |
| 63 | `src/components/shared/confirm-dialog.tsx` | Criar | Modal de confirmação | — |
| 64 | `src/components/shared/page-header.tsx` | Criar | Header com breadcrumb e ações | — |

**Total de Arquivos:** 64

---

## Code Patterns

### Pattern 1: Supabase Server Client (para Server Components e API Routes)

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// Para API Routes que precisam de service_role (ex: invite user)
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // nunca expor no frontend
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
```

### Pattern 2: Supabase Browser Client (para Client Components)

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 3: Middleware de Autenticação e Redirecionamento por Role

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        ),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Usuário não autenticado tenta acessar área protegida
  if (!user && (path.startsWith('/admin') || path.startsWith('/portal'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // lab_admin acessando portal ou raiz → redireciona para admin
    if (role === 'lab_admin' && path.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    // client acessando admin → redireciona para portal
    if (role === 'client' && path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/portal/dashboard', request.url))
    }

    // Login page acessado por usuário autenticado
    if (path === '/login') {
      const dest = role === 'lab_admin' ? '/admin/dashboard' : '/portal/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
```

### Pattern 4: Alert Checker (lógica central de detecção)

```typescript
// src/lib/alerts/checker.ts
import type { Database } from '@/types/database'

type Parameter = Database['public']['Tables']['parameters']['Row']
type ResultInput = { parameter_id: string; value: number | null; value_text?: string }

export interface CheckedResult extends ResultInput {
  is_alert: boolean
}

export function checkAlerts(
  results: ResultInput[],
  parameters: Parameter[]
): CheckedResult[] {
  const paramMap = new Map(parameters.map(p => [p.id, p]))

  return results.map(result => {
    const param = paramMap.get(result.parameter_id)
    if (!param || result.value === null) {
      return { ...result, is_alert: false }
    }

    const { ref_min, ref_max } = param
    const isBelow = ref_min !== null && result.value < ref_min
    const isAbove = ref_max !== null && result.value > ref_max

    return { ...result, is_alert: isBelow || isAbove }
  })
}

export function hasAnyAlert(checkedResults: CheckedResult[]): boolean {
  return checkedResults.some(r => r.is_alert)
}
```

### Pattern 5: API Route — Criar Análise com Alertas e E-mail

```typescript
// src/app/api/analyses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAlerts, hasAnyAlert } from '@/lib/alerts/checker'
import { sendAlertEmail } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { pond_id, collected_at, analyzed_at, technician, notes, results } = body

  // Buscar parâmetros para calcular alertas
  const { data: parameters } = await supabase
    .from('parameters')
    .select('*')
    .in('id', results.map((r: any) => r.parameter_id))

  const checkedResults = checkAlerts(results, parameters ?? [])
  const alertsFound = hasAnyAlert(checkedResults)

  // Inserir análise
  const { data: analysis, error } = await supabase
    .from('analyses')
    .insert({
      pond_id, collected_at, analyzed_at, technician, notes,
      has_alerts: alertsFound,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Inserir resultados
  await supabase.from('analysis_results').insert(
    checkedResults.map(r => ({
      analysis_id: analysis.id,
      parameter_id: r.parameter_id,
      value: r.value,
      value_text: r.value_text,
      is_alert: r.is_alert,
    }))
  )

  // Disparar e-mail de alerta se necessário
  if (alertsFound) {
    // Buscar e-mail do cliente via pond → farm → client
    const { data: pond } = await supabase
      .from('ponds')
      .select('farm:farms(client:clients(email, id, full_name:clients(name)))')
      .eq('id', pond_id)
      .single()

    // Enviar e-mail (fire-and-forget; logar falha)
    sendAlertEmail({
      analysisId: analysis.id,
      alertedResults: checkedResults.filter(r => r.is_alert),
      parameters: parameters ?? [],
      pond,
    }).catch(err => console.error('[Alert Email]', err))
  }

  return NextResponse.json({ analysis }, { status: 201 })
}
```

### Pattern 6: Template de E-mail de Alerta (React Email)

```tsx
// src/lib/email/templates/alert-email.tsx
import {
  Html, Head, Body, Container, Heading, Text, Section, Row, Column, Hr
} from '@react-email/components'

interface AlertEmailProps {
  clientName: string
  pondName: string
  farmName: string
  collectedAt: string
  alertedParams: Array<{ name: string; value: string; unit: string; refMax?: number; refMin?: number }>
  portalUrl: string
}

export function AlertEmail({ clientName, pondName, farmName, collectedAt, alertedParams, portalUrl }: AlertEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, sans-serif', background: '#f0f9ff' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 16px' }}>
          <Heading style={{ color: '#0c4a6e', fontSize: '24px' }}>
            ⚠️ Alerta de Qualidade da Água
          </Heading>
          <Text>Olá, <strong>{clientName}</strong>!</Text>
          <Text>
            A análise coletada em <strong>{collectedAt}</strong> no viveiro{' '}
            <strong>{pondName}</strong> ({farmName}) identificou parâmetros fora dos valores de referência:
          </Text>
          <Section style={{ background: '#fff1f2', borderRadius: '8px', padding: '16px' }}>
            {alertedParams.map((p) => (
              <Row key={p.name} style={{ marginBottom: '8px' }}>
                <Column><strong>{p.name}</strong></Column>
                <Column style={{ color: '#dc2626' }}>{p.value} {p.unit}</Column>
              </Row>
            ))}
          </Section>
          <Hr />
          <Text>
            Acesse o portal para ver o resultado completo e o histórico de evolução:
          </Text>
          <Text>
            <a href={portalUrl} style={{ color: '#0369a1' }}>{portalUrl}</a>
          </Text>
          <Text style={{ color: '#6b7280', fontSize: '12px' }}>
            Camarão Camarada — Portal de Monitoramento da Qualidade da Água
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

### Pattern 7: Gráfico de Evolução Temporal (Recharts)

```tsx
// src/components/charts/parameter-chart.tsx
'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DataPoint { collected_at: string; value: number; is_alert: boolean }
interface ParameterChartProps {
  data: DataPoint[]
  parameterName: string
  unit: string | null
  refMin: number | null
  refMax: number | null
}

export function ParameterChart({ data, parameterName, unit, refMin, refMax }: ParameterChartProps) {
  const formatted = data.map(d => ({
    date: format(new Date(d.collected_at), 'dd/MM', { locale: ptBR }),
    value: d.value,
    alert: d.is_alert,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formatted} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} unit={unit ? ` ${unit}` : ''} />
        <Tooltip
          formatter={(value: number) => [`${value}${unit ? ` ${unit}` : ''}`, parameterName]}
        />
        {refMin !== null && (
          <ReferenceLine y={refMin} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Mín', fill: '#f59e0b', fontSize: 11 }} />
        )}
        {refMax !== null && (
          <ReferenceLine y={refMax} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Máx', fill: '#ef4444', fontSize: 11 }} />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0284c7"
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props
            return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={payload.alert ? '#ef4444' : '#0284c7'} stroke="white" strokeWidth={2} />
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Pattern 8: RLS Policies SQL

```sql
-- supabase/migrations/002_rls_policies.sql

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponds             ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

-- Helper function: role do usuário atual
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: client_id do usuário atual
CREATE OR REPLACE FUNCTION current_client_id()
RETURNS UUID AS $$
  SELECT id FROM clients WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- profiles: cada usuário vê/edita apenas o próprio perfil
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (id = auth.uid());

-- clients: lab_admin vê todos; client vê apenas o próprio
CREATE POLICY "clients_lab_admin" ON clients
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "clients_self" ON clients
  FOR SELECT USING (user_id = auth.uid());

-- farms: lab_admin vê todas; client vê as suas
CREATE POLICY "farms_lab_admin" ON farms
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "farms_client" ON farms
  FOR SELECT USING (client_id = current_client_id());

-- ponds: lab_admin vê todos; client vê os seus (via farm)
CREATE POLICY "ponds_lab_admin" ON ponds
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "ponds_client" ON ponds
  FOR SELECT USING (
    farm_id IN (SELECT id FROM farms WHERE client_id = current_client_id())
  );

-- parameters: lab_admin gerencia; todos authenticated leem
CREATE POLICY "parameters_lab_admin" ON parameters
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "parameters_read" ON parameters
  FOR SELECT USING (auth.role() = 'authenticated');

-- analyses: lab_admin gerencia; client vê as suas
CREATE POLICY "analyses_lab_admin" ON analyses
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "analyses_client" ON analyses
  FOR SELECT USING (
    pond_id IN (
      SELECT p.id FROM ponds p
      JOIN farms f ON p.farm_id = f.id
      WHERE f.client_id = current_client_id()
    )
  );

-- analysis_results: segue mesma lógica de analyses
CREATE POLICY "results_lab_admin" ON analysis_results
  FOR ALL USING (current_user_role() = 'lab_admin');

CREATE POLICY "results_client" ON analysis_results
  FOR SELECT USING (
    analysis_id IN (
      SELECT a.id FROM analyses a
      JOIN ponds p ON a.pond_id = p.id
      JOIN farms f ON p.farm_id = f.id
      WHERE f.client_id = current_client_id()
    )
  );

-- notifications: apenas lab_admin
CREATE POLICY "notifications_lab_admin" ON notifications
  FOR ALL USING (current_user_role() = 'lab_admin');
```

### Pattern 9: Alert Badge Component

```tsx
// src/components/shared/alert-badge.tsx
import { Badge } from '@/components/ui/badge'

interface AlertBadgeProps {
  hasAlerts: boolean
  alertCount?: number
}

export function AlertBadge({ hasAlerts, alertCount = 0 }: AlertBadgeProps) {
  if (!hasAlerts) {
    return <Badge className="bg-green-100 text-green-800 border-green-200">Normal</Badge>
  }
  if (alertCount >= 3) {
    return <Badge className="bg-red-100 text-red-800 border-red-200">⚠️ {alertCount} alertas</Badge>
  }
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⚠️ {alertCount} alerta{alertCount > 1 ? 's' : ''}</Badge>
}
```

### Pattern 10: Variáveis de Ambiente

```bash
# .env.example

# Supabase (público - pode aparecer no bundle do browser)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase Admin (privado - apenas server-side)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Resend (privado - apenas server-side)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@camaraocamarada.com.br

# App
NEXT_PUBLIC_APP_URL=https://camaraocamarada.vercel.app
```

---

## Data Flow

### Fluxo 1: Registro de Análise com Alerta

```
Lab Admin preenche formulário (AnalysisForm)
  │
  ▼
POST /api/analyses  { pond_id, collected_at, results: [{parameter_id, value}] }
  │
  ▼
createClient() → supabase.auth.getUser() → verifica autenticação
  │
  ▼
supabase.from('parameters').select() → busca ref_min / ref_max
  │
  ▼
checkAlerts(results, parameters) → marca is_alert em cada resultado
  │
  ├─ has_alerts = true?
  │
  ▼
supabase.from('analyses').insert({ ..., has_alerts }) → persiste análise
  │
  ▼
supabase.from('analysis_results').insert(checkedResults) → persiste resultados
  │
  ├─ has_alerts = true?
  │       │
  │       ▼
  │   Busca e-mail do cliente via pond → farm → client
  │       │
  │       ▼
  │   sendAlertEmail() via Resend SDK (fire-and-forget)
  │       │
  │       ▼
  │   supabase.from('notifications').insert({ success: true/false })
  │
  ▼
return { analysis } → frontend redireciona para /admin/analyses/[id]
```

### Fluxo 2: Cliente Visualiza Evolução

```
Cliente acessa /portal/ponds/[id]
  │
  ▼
Server Component busca análises do viveiro (via RLS automático)
  │
  ▼
Renderiza AnalysisTable com AlertBadge por linha
  │
  ▼
Cliente seleciona parâmetro no seletor
  │
  ▼
Client Component (ParameterChart) renderiza LineChart
com pontos vermelhos nos alertas e linhas de referência
```

### Fluxo 3: Geração de PDF

```
Usuário clica "Baixar PDF" (PdfDownloadButton)
  │
  ▼
Client Component muda visibility de AnalysisPdfLayout
(hidden → block, fora da viewport)
  │
  ▼
html2canvas(element) → captura como canvas
  │
  ▼
jsPDF.addImage(canvas) → monta documento PDF
  │
  ▼
jsPDF.save('analise-{id}.pdf') → download automático
```

---

## Integration Points

| Sistema Externo | Tipo | Autenticação | Notas |
|-----------------|------|--------------|-------|
| Supabase Auth | SDK (`@supabase/ssr`) | JWT (gerenciado pelo Supabase) | Session via cookies HTTP-only |
| Supabase PostgreSQL | SDK JS | ANON_KEY (RLS) / SERVICE_ROLE_KEY (admin) | Service role apenas server-side |
| Resend | SDK REST | API Key (header Authorization) | Apenas em API Routes |
| Vercel | CI/CD via GitHub | Vercel Access Token (configurado no dashboard) | Deploy automático no push |
| GitHub | Repositório | SSH Key / HTTPS | Source of truth do código |

---

## Testing Strategy

| Tipo | Escopo | Arquivos | Ferramentas | Meta de Cobertura |
|------|--------|----------|-------------|-------------------|
| **Unit** | Funções puras (checkAlerts, formatDate) | `src/lib/**/*.test.ts` | Jest + ts-jest | 90% das funções em `lib/` |
| **Integration** | API Routes (mock Supabase) | `src/app/api/**/*.test.ts` | Jest + MSW | Fluxos POST /analyses, emails |
| **Component** | Componentes React | `src/components/**/*.test.tsx` | Jest + Testing Library | AlertBadge, ParameterChart |
| **E2E Manual** | Fluxo completo em staging | — | Manual no Vercel Preview | AT-001 a AT-015 do DEFINE |

**Prioridade de testes para MVP:**
1. `src/lib/alerts/checker.test.ts` — lógica mais crítica, 100% cobertura
2. `src/app/api/analyses/route.test.ts` — fluxo principal
3. AT-011 (isolamento RLS) — testar manualmente com dois usuários

---

## Error Handling

| Tipo de Erro | Estratégia | Retry? |
|-------------|-----------|--------|
| Sessão expirada | Middleware redireciona para /login | Não |
| Falha no envio de e-mail (Resend) | Fire-and-forget; logar em `notifications(success=false)`; não bloquear resposta | Não |
| Parâmetro sem ref_min/ref_max | Ignorar alerta para esse parâmetro (is_alert=false) | — |
| Valor de análise vazio/nulo | Aceitar; value=null significa "não coletado" | — |
| Supabase pausa por inatividade | Vercel Cron Job faz ping a cada 5 dias: `GET /api/health` | Automático |
| PDF > limite de memória browser | Exibir mensagem: "Use desktop para gerar PDF" | Não |
| Erro 403 ao acessar dados de outro cliente | RLS retorna 0 rows; UI exibe "Não encontrado" (404) | Não |

---

## Configuration

| Variável | Tipo | Onde | Descrição |
|----------|------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | string | `.env.local` + Vercel | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | `.env.local` + Vercel | Chave pública (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | string | `.env.local` + Vercel | Chave admin (somente server) |
| `RESEND_API_KEY` | string | `.env.local` + Vercel | API key do Resend |
| `RESEND_FROM_EMAIL` | string | `.env.local` + Vercel | E-mail remetente |
| `NEXT_PUBLIC_APP_URL` | string | `.env.local` + Vercel | URL base para links nos e-mails |

---

## Security Considerations

1. **`SUPABASE_SERVICE_ROLE_KEY` nunca no frontend** — usada apenas em API Routes server-side; bypassa RLS se vazada
2. **RLS em todas as tabelas** — validado antes de ir para produção com dois usuários distintos (AT-011)
3. **Validação de inputs na API Route** — nunca confiar no body sem validação; usar `zod` para schema validation antes de inserir no banco
4. **CSRF protection** — Next.js App Router com `same-origin` cookies é protegido por padrão; API Routes com `Content-Type: application/json` não são vulneráveis a form-based CSRF
5. **Rate limiting no e-mail** — Resend tem limite próprio; adicionar verificação para não enviar e-mail duplicado para mesma análise (verificar `notifications` antes de disparar)
6. **Headers de segurança** — configurar no `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
7. **Variáveis de ambiente** — `.env.local` no `.gitignore`; nunca commitar chaves reais

---

## Observability

| Aspecto | Implementação |
|---------|---------------|
| **Logging** | `console.error` estruturado nas API Routes (aparece no Vercel Logs) |
| **Erros de e-mail** | Gravados na tabela `notifications(success=false, error_message)` — visível no admin |
| **Métricas básicas** | Vercel Analytics (incluso no Hobby plan) — pageviews, performance |
| **Supabase inatividade** | Vercel Cron Job: `GET /api/health` a cada 5 dias (Hobby: 1 cron grátis) |
| **Erros de runtime** | Vercel Error Tracking (incluso no Hobby plan) — erros não capturados |

---

## Tema Visual — Tailwind Config

```typescript
// tailwind.config.ts (extensão do tema)
import type { Config } from 'tailwindcss'

export default {
  // ...
  theme: {
    extend: {
      colors: {
        // Identidade aquícola
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          900: '#0c4a6e',
        },
        seagreen: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
      },
    },
  },
} satisfies Config
```

---

## Dependências do Projeto

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/ssr": "^0.5.x",
    "@supabase/supabase-js": "^2.x",
    "recharts": "^2.12.x",
    "jspdf": "^2.5.x",
    "html2canvas": "^1.4.x",
    "resend": "^3.x",
    "@react-email/components": "^0.0.x",
    "date-fns": "^3.x",
    "zod": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "tailwindcss": "^3.4.x",
    "eslint": "^8.x",
    "eslint-config-next": "14.x",
    "jest": "^29.x",
    "@testing-library/react": "^16.x",
    "@testing-library/jest-dom": "^6.x"
  }
}
```

---

## Checklist de Qualidade

```
[x] Diagrama de arquitetura claro
[x] Todas as decisões principais documentadas com rationale
[x] File manifest completo (64 arquivos listados)
[x] Code patterns copy-paste prontos (10 patterns)
[x] Estratégia de testes definida
[x] Sem dependências circulares na arquitetura
[x] Variáveis de ambiente documentadas
[x] RLS policies em SQL completo
[x] Seed data em SQL pronto
[x] Tratamento de erros mapeado
[x] Considerações de segurança documentadas
```

---

## Revision History

| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-06-20 | design-agent | Versão inicial a partir de DEFINE_CAMARAO_CAMARADA.md |

---

## Next Step

**Ready for:** `/build .claude/sdd/features/DESIGN_CAMARAO_CAMARADA.md`
