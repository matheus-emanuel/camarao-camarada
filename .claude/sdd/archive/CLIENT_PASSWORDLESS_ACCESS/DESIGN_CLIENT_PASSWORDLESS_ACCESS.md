# DESIGN: Client Passwordless Access

> Technical design for implementing Client Passwordless Access

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | CLIENT_PASSWORDLESS_ACCESS |
| **Date** | 2026-08-13 |
| **Author** | design-agent |
| **DEFINE** | [DEFINE_CLIENT_PASSWORDLESS_ACCESS.md](./DEFINE_CLIENT_PASSWORDLESS_ACCESS.md) |
| **Status** | ✅ Shipped |

---

## Architecture Overview

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                          CLIENT PASSWORDLESS ACCESS                        │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [/login UI]                                                               │
│  campo único "E-mail ou CPF"                                               │
│        │                                                                   │
│        ▼                                                                   │
│  POST /api/auth/access-request  ──uses──▶  [createAdminClient()]           │
│        │                                    (service role, bypassa RLS)    │
│        ▼                                                                   │
│  1. normalizeIdentifier() → é e-mail? é CPF (11 dígitos)?                  │
│  2. SELECT * FROM clients                                                  │
│       WHERE email = :id OR document_digits = :id_digits                    │
│        │                                                                   │
│        ├─ não encontrado ─▶ 404 "cadastro não encontrado"                  │
│        │                                                                   │
│        ├─ encontrado, user_id IS NULL (primeiro acesso)                    │
│        │     │                                                             │
│        │     ▼                                                             │
│        │  adminClient.auth.admin.createUser({ email, user_metadata })      │
│        │     │                                                             │
│        │     ▼                                                             │
│        │  UPDATE clients SET user_id = novo_id WHERE id = client.id        │
│        │     │  (falhou? → auth.admin.deleteUser(novo_id) + 500)           │
│        │     ▼                                                             │
│        └─ encontrado, user_id preenchido (acesso recorrente) ──┐           │
│                                                                 ▼           │
│                              anonClient.auth.signInWithOtp({ email,        │
│                                shouldCreateUser:false, emailRedirectTo })   │
│                                          │                                  │
│                                          ▼                                  │
│                          [Supabase Auth envia e-mail com magic link]        │
│                                          │                                  │
│        ◀─── resposta: { maskedEmail } ──┘                                  │
│        │                                                                   │
│        ▼                                                                   │
│  [tela "enviamos um link para f***@gmail.com"]                             │
│                                                                             │
│  ── cliente clica no link do e-mail ──▶                                    │
│                                                                             │
│  GET /auth/callback (já existe, sem mudança)                               │
│        │ exchangeCodeForSession(code)                                      │
│        ▼                                                                   │
│  [src/middleware.ts] (já existe, sem mudança)                              │
│        │ role === 'client' →                                               │
│        ▼                                                                   │
│  [/portal/dashboard] — visão já existente, inalterada                      │
│                                                                             │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| `AccessForm` (`/login`) | Campo único e-mail/CPF, chama o endpoint, mostra confirmação mascarada; mantém aba "Entrar com senha" como fallback | React Client Component (Next.js 14) |
| `POST /api/auth/access-request` | Busca `clients`, cria+vincula `auth.users` no primeiro acesso, dispara `signInWithOtp` | Next.js Route Handler + `@supabase/ssr` |
| `clients.document_digits` | Coluna gerada (CPF sem máscara) + índice funcional, usada como chave de busca | PostgreSQL generated column |
| `handle_new_user()` (corrigido) | Cria `profiles` ao criar `auth.users`, sem engolir erros silenciosamente | PL/pgSQL trigger function |
| `/auth/callback` (existente) | Troca `code` por sessão | Next.js Route Handler (sem mudança) |
| `src/middleware.ts` (existente) | Redireciona por role para `/portal/dashboard` | Next.js Middleware (sem mudança) |

---

## Key Decisions

### Decision 1: Reaproveitar `signInWithOtp` do Supabase Auth em vez de OTP/token customizado

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-08-13 |

**Context:** Precisamos entregar um link/código de acesso por e-mail sem senha, sem introduzir infraestrutura nova (stack deve continuar 100% gratuita, ver `project_camarao_camarada`).

**Choice:** Usar `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo } })` com a chave anônima, reaproveitando o mesmo `/auth/callback` (`exchangeCodeForSession`) que já existe para o fluxo de convite.

**Rationale:** O Supabase Auth já está configurado no projeto (templates de e-mail, SMTP/Resend, rate limiting nativo por e-mail/IP). Reaproveitar evita gerenciar geração/expiração/hash de tokens próprios e evita uma segunda tabela de credenciais.

**Alternatives Rejected:**
1. Código OTP de 6 dígitos customizado, gerado e validado por nós — rejeitado: exige tabela de tokens, expiração, e reenviar por e-mail de qualquer forma (mesmo custo de infra, mais superfície de bugs).
2. Deep link assinado por nós (JWT próprio) — rejeitado: duplica o que o Supabase Auth já faz nativamente com `signInWithOtp`.

**Consequences:**
- Ganhamos rate limiting e anti-abuso nativos do Supabase Auth "de graça".
- Ficamos com o template de e-mail padrão do Supabase para magic link (aceitável para MVP; personalização de template é melhoria futura, fora de escopo).

---

### Decision 2: Criação + vinculação do usuário são feitas com compensação, não uma transação SQL única

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-08-13 |

**Context:** O MUST do DEFINE pede vinculação "atômica" de `clients.user_id` ao criar o `auth.users` no primeiro acesso. `auth.users` vive no schema gerenciado pelo GoTrue (Supabase Auth), fora do controle transacional do nosso `public.clients` — não é possível envolver os dois num único `BEGIN/COMMIT` SQL.

**Choice:** Implementar como duas chamadas sequenciais no mesmo request: (1) `adminClient.auth.admin.createUser(...)`, (2) `UPDATE clients SET user_id = ...`. Se (2) falhar, compensar chamando `adminClient.auth.admin.deleteUser(novo_id)` antes de responder erro ao cliente — nunca deixamos um `auth.users` órfão sem `clients.user_id`.

**Rationale:** É o mais próximo de atomicidade que dá para garantir entre dois sistemas distintos, e resolve diretamente a classe de bug já documentada (`project_handle_new_user_trigger_bug`, `project_client_onboarding_flow`) onde a vinculação falhava fora de qualquer transação e sem rollback.

**Alternatives Rejected:**
1. Confiar apenas na correção do trigger `handle_new_user()` para garantir consistência — rejeitado: o trigger só cria `profiles`, não resolve a vinculação `clients.user_id`, que é uma responsabilidade da aplicação.
2. RPC PL/pgSQL que chama `auth.admin` internamente — rejeitado: Admin API do GoTrue não é acessível de dentro de uma function SQL/plpgsql no Postgres gerenciado do Supabase.

**Consequences:**
- Existe uma janela (milissegundos) entre criar o `auth.users` e vincular `clients.user_id`; se o processo morrer exatamente nesse meio (crash do servidor, não erro de query), pode restar um órfão — aceito como risco residual de baixa probabilidade para o MVP (não coberto por retry automático nesta versão).
- Ganhamos: nunca respondemos "sucesso" ao cliente com um estado inconsistente no banco.

---

## File Manifest

| # | File | Action | Purpose | Agent | Dependencies |
|---|------|--------|---------|-------|--------------|
| 1 | `supabase/migrations/20260814000001_client_document_lookup.sql` | Create | Coluna gerada `document_digits` + índice funcional em `clients`; índice case-insensitive em `email` | @supabase-specialist | None |
| 2 | `supabase/migrations/20260814000002_fix_handle_new_user_trigger.sql` | Create | Corrige `handle_new_user()` em produção: remove `EXCEPTION WHEN OTHERS` que engole erros, mantém `ON CONFLICT DO NOTHING` | @supabase-specialist | None |
| 3 | `src/types/database.ts` | Modify | Adicionar `document_digits: string \| null` ao tipo `Row` de `clients` | @supabase-specialist | 1 |
| 4 | `src/lib/auth/identifier.ts` | Create | Helpers puros: `looksLikeEmail`, `normalizeDocumentDigits`, `maskEmail` | (general) | None |
| 5 | `src/app/api/auth/access-request/route.ts` | Create | Endpoint público: busca `clients`, cria+vincula usuário no primeiro acesso, dispara `signInWithOtp` | @supabase-specialist | 1, 3, 4 |
| 6 | `src/app/login/page.tsx` | Modify | Novo formulário padrão (e-mail/CPF, sem senha) + aba "Entrar com senha" preservando o formulário atual | @ui-specialist | 5 |
| 7 | `src/app/auth/callback/route.ts` | No change | Reaproveitado como está — `next` já suporta `?next=/portal/dashboard` | — | — |

**Total Files:** 6 (criados/modificados) + 1 confirmado sem mudança

---

## Agent Assignment Rationale

> Agentes descobertos em `${CLAUDE_PLUGIN_ROOT}/agents/` — Build phase invoca os especialistas indicados.

| Agent | Files Assigned | Why This Agent |
|-------|----------------|-----------------|
| @supabase-specialist | 1, 2, 3, 5 | `agentspec:cloud:supabase-specialist` — especialista em Auth, RLS e migrations do Supabase, com acesso MCP à instância viva; é quem deve tocar Admin API (`auth.admin.createUser/deleteUser`), migrations SQL e o tipo `Database` derivado do schema |
| @ui-specialist | 6 | `agentspec:design:ui-specialist` — implementação de componente/formulário e estados de UI (loading, erro, confirmação mascarada), sem lógica de negócio própria |
| (general) | 4 | Utilitário TypeScript puro (regex/string), sem dependência de Supabase ou de design system — não exige especialista |

**Agent Discovery:**
- Fonte: listagem de agentes disponível na sessão (`agentspec:cloud:supabase-specialist`, `agentspec:design:ui-specialist`, entre outros)
- Critério: tipo de arquivo (`.sql` → supabase-specialist), palavras-chave de propósito ("Admin API", "RLS", "migration" → supabase-specialist; "formulário", "estados de UI" → ui-specialist), fallback geral para utilitário sem domínio específico

---

## Code Patterns

### Pattern 1: Migration — coluna gerada + índice funcional para CPF

```sql
-- supabase/migrations/20260814000001_client_document_lookup.sql

ALTER TABLE clients
  ADD COLUMN document_digits TEXT
  GENERATED ALWAYS AS (regexp_replace(COALESCE(document, ''), '\D', '', 'g')) STORED;

CREATE UNIQUE INDEX idx_clients_document_digits
  ON clients (document_digits)
  WHERE document_digits <> '';

CREATE INDEX idx_clients_email_lower
  ON clients (lower(email));
```

### Pattern 2: Migration — trigger sem engolir erros

```sql
-- supabase/migrations/20260814000002_fix_handle_new_user_trigger.sql

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
-- Sem EXCEPTION WHEN OTHERS: um erro real agora propaga e falha
-- a criação do auth.users (visível na chamada Admin API), em vez
-- de ser engolido silenciosamente.
```

### Pattern 3: Helpers de identificador (`src/lib/auth/identifier.ts`)

```typescript
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function normalizeDocumentDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, 1)
  return `${visible}${'*'.repeat(Math.max(local.length - 1, 3))}@${domain}`
}
```

### Pattern 4: Endpoint `/api/auth/access-request`

```typescript
// src/app/api/auth/access-request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { looksLikeEmail, normalizeDocumentDigits, maskEmail } from '@/lib/auth/identifier'

const RequestSchema = z.object({ identifier: z.string().min(3) })

export async function POST(request: NextRequest) {
  const parsed = RequestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Informe um e-mail ou CPF válido.' }, { status: 400 })
  }

  const identifier = parsed.data.identifier.trim()
  const adminClient = createAdminClient()

  const query = adminClient.from('clients').select('id, email, company_name, user_id')
  const { data: client } = looksLikeEmail(identifier)
    ? await query.ilike('email', identifier).maybeSingle()
    : await query.eq('document_digits', normalizeDocumentDigits(identifier)).maybeSingle()

  if (!client) {
    return NextResponse.json(
      { error: 'Cadastro não encontrado. Fale com o laboratório.' },
      { status: 404 }
    )
  }

  let userId = client.user_id

  if (!userId) {
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: client.email,
      email_confirm: true,
      user_metadata: { role: 'client', full_name: client.company_name ?? client.email },
    })

    if (createError || !created?.user) {
      return NextResponse.json({ error: 'Não foi possível iniciar o acesso.' }, { status: 500 })
    }

    const { error: linkError } = await adminClient
      .from('clients')
      .update({ user_id: created.user.id })
      .eq('id', client.id)

    if (linkError) {
      await adminClient.auth.admin.deleteUser(created.user.id) // compensação — ver Decision 2
      return NextResponse.json({ error: 'Não foi possível iniciar o acesso.' }, { status: 500 })
    }

    userId = created.user.id
  }

  const supabase = createClient()
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email: client.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/portal/dashboard`,
    },
  })

  if (otpError) {
    return NextResponse.json({ error: 'Não foi possível enviar o link de acesso.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, maskedEmail: maskEmail(client.email) })
}
```

---

## Data Flow

```text
1. Cliente digita e-mail ou CPF em /login e submete o formulário
   │
   ▼
2. POST /api/auth/access-request valida o formato e normaliza o identificador
   │
   ▼
3. Busca em `clients` (via service role, ignora RLS) por email OU document_digits
   │
   ├─ não encontrado → 404 genérico, fim do fluxo
   │
   ▼ encontrado
4. user_id nulo? → cria auth.users (Admin API) + vincula clients.user_id (com compensação em falha)
   │
   ▼
5. Dispara signInWithOtp (shouldCreateUser:false) → Supabase Auth envia e-mail
   │
   ▼
6. UI mostra "enviamos um link para f***@gmail.com"
   │
   ▼
7. Cliente clica no link → GET /auth/callback troca code por sessão
   │
   ▼
8. middleware.ts redireciona role=client → /portal/dashboard (view existente, inalterada)
```

---

## Integration Points

| External System | Integration Type | Authentication |
|-----------------|-----------------|-----------------|
| Supabase Auth (GoTrue) | SDK (`@supabase/ssr`) — `auth.admin.createUser`, `auth.admin.deleteUser`, `auth.signInWithOtp` | Service role key (admin ops) / anon key (signInWithOtp) |
| Supabase Postgres (`clients`, `profiles`) | SDK query builder | Service role key (bypassa RLS na busca pré-autenticação) |
| Provedor de e-mail (SMTP/Resend, já configurado no projeto Auth) | Disparado internamente pelo Supabase Auth ao chamar `signInWithOtp` | Configurado no dashboard Supabase, sem chamada direta desta feature |

---

## Testing Strategy

| Test Type | Scope | Files | Tools | Coverage Goal |
|-----------|-------|-------|-------|----------------|
| Unit | `looksLikeEmail`, `normalizeDocumentDigits`, `maskEmail` | `src/lib/auth/identifier.test.ts` | Vitest/Jest (o que o projeto já usa) | 100% dos helpers (AT-002, AT-005) |
| Integration | `/api/auth/access-request` contra Supabase local/staging | manual via `curl`/Postman + Supabase local (`supabase start`) | Supabase CLI local stack | AT-001, AT-003, AT-004, AT-006 |
| E2E | Fluxo completo primeiro acesso e acesso recorrente | Manual no browser | Navegador + inbox de teste (Mailpit local do Supabase CLI) | AT-001 a AT-005 (happy path + CPF com/sem máscara) |
| Migration smoke test | `document_digits` gerado corretamente para dados existentes | SQL manual pós-migration | `psql`/Supabase Studio | Verifica que registros antigos (com/sem máscara) convergem para o mesmo `document_digits` |

Cobertura por Acceptance Test do DEFINE:

| AT | Como é validado |
|----|------------------|
| AT-001 (primeiro acesso via e-mail) | Integration + E2E |
| AT-002 (primeiro acesso via CPF mascarado) | Unit (`normalizeDocumentDigits`) + Integration |
| AT-003 (login recorrente) | Integration — confirma que `auth.admin.createUser` não é chamado quando `user_id` já existe |
| AT-004 (cadastro inexistente) | Integration — resposta 404 genérica |
| AT-005 (CPF sem máscara) | Unit + Integration |
| AT-006 (trigger corrigido) | Migration smoke test — força um erro proposital (ex.: `full_name` obrigatório ausente) e confirma que a exceção propaga em vez de ser engolida |

---

## Error Handling

| Error Type | Handling Strategy | Retry? |
|------------|--------------------|--------|
| Identificador não encontrado em `clients` | 404 com mensagem genérica ("cadastro não encontrado, fale com o laboratório") — comportamento aceito no DEFINE (assumption A-005) | Não |
| `auth.admin.createUser` falha (ex.: e-mail já existe em `auth.users` sem vínculo em `clients`) | 500 genérico ao usuário; log server-side com o motivo real do Supabase | Não automático — usuário pode tentar novamente |
| `UPDATE clients.user_id` falha após criar o usuário | Compensação: `auth.admin.deleteUser` do usuário recém-criado, depois 500 genérico | Sim, usuário pode tentar novamente do zero |
| `signInWithOtp` falha (rate limit do Supabase, SMTP fora do ar) | 500 com mensagem "não foi possível enviar o link"; usuário já vinculado, pode tentar de novo sem recriar usuário | Sim |
| Identificador em formato inválido (não é e-mail nem 11 dígitos) | 400 com mensagem de validação do Zod | Não |

---

## Configuration

| Config Key | Type | Default | Description |
|------------|------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | string | (existente) | Já usado pelo projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | (existente) | Usado pelo cliente anônimo para `signInWithOtp` |
| `SUPABASE_SERVICE_ROLE_KEY` | string | (existente) | Usado por `createAdminClient()` para busca pré-auth e Admin API |
| `NEXT_PUBLIC_APP_URL` | string | (existente) | Base do `emailRedirectTo` para `/auth/callback` |

Nenhuma variável de ambiente nova é introduzida — reaproveita as já usadas por `/api/clients/invite`.

---

## Security Considerations

- CPF **nunca** é tratado como credencial: só é usado como chave de busca em `clients`; o link de acesso é sempre entregue ao e-mail já cadastrado, nunca a um e-mail informado pelo usuário na hora.
- Busca por e-mail/CPF ocorre com `createAdminClient()` (service role) porque o endpoint é chamado por um visitante não autenticado — não há sessão para RLS avaliar (`current_client_id()`/`current_user_role()` retornariam nulo). O service role fica confinado a este endpoint e a `/api/clients/invite` (já existente), consistente com o padrão já usado no projeto.
- A resposta de "cadastro não encontrado" é distinguível da de sucesso (decisão consciente registrada no DEFINE, assumption A-005) — aceitável para o MVP fechado (~50 clientes cadastrados manualmente, sem autocadastro público); reavaliar se o produto abrir cadastro público no futuro.
- `shouldCreateUser: false` em `signInWithOtp` evita que essa chamada crie um segundo usuário paralelo por race condition — a criação é sempre explícita via `auth.admin.createUser` no passo anterior.
- Nenhuma senha é armazenada ou transmitida neste fluxo; o mecanismo de senha existente (`signInWithPassword`) permanece disponível e não é afetado.

---

## Observability

| Aspect | Implementation |
|--------|-----------------|
| Logging | `console.error` estruturado nos branches de erro do route handler (mesmo padrão já usado em `/api/clients/invite`), incluindo o motivo real do Supabase (nunca exposto ao cliente) |
| Metrics | Fora de escopo nesta rodada (sem ferramenta de métricas no projeto ainda) |
| Tracing | Fora de escopo — MVP de laboratório único, sem necessidade de tracing distribuído |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-13 | design-agent | Initial version |
| 1.1 | 2026-08-14 | ship-agent | Shipped and archived |

---

## Next Step

**Ready for:** `/ship .claude/sdd/features/DEFINE_CLIENT_PASSWORDLESS_ACCESS.md`
