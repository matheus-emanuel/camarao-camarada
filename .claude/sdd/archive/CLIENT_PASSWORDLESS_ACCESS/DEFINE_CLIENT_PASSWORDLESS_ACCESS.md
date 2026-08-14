# DEFINE: Client Passwordless Access

> Clientes (fazendeiros) pré-cadastrados pelo laboratório acessam o portal existente digitando apenas e-mail ou CPF, sem senha e sem preencher formulário de cadastro.

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | CLIENT_PASSWORDLESS_ACCESS |
| **Date** | 2026-08-13 |
| **Author** | define-agent (via conversa com o usuário) |
| **Status** | ✅ Shipped |
| **Clarity Score** | 15/15 |

---

## Problem Statement

Hoje o cliente (fazendeiro) só consegue acessar o portal via um fluxo de convite por e-mail frágil (`inviteUserByEmail` → definir senha), que depende de um trigger de banco (`handle_new_user`) já divergente entre migration e produção e engolindo erros silenciosamente, e de uma vinculação `clients.user_id` feita fora de transação — o resultado é clientes que "têm login mas não veem nada" ou nunca recebem o convite, sem um caminho de autoatendimento para tentar de novo usando um dado que eles já sabem de cor (e-mail ou CPF).

---

## Target Users

| User | Role | Pain Point |
|------|------|------------|
| Fazendeiro/cliente | `client` (usuário final do portal) | Não recebeu/perdeu o e-mail de convite, não quer gerenciar senha, e não deveria precisar redigitar dados que o laboratório já cadastrou (nome, endereço, etc.) só para entrar |
| Técnico/admin do laboratório | `lab_admin` (cadastra clientes) | Recebe reclamações de "não consigo entrar" sem visibilidade — a vinculação `clients.user_id` pode falhar silenciosamente, deixando o cliente com conta órfã |

---

## Goals

| Priority | Goal |
|----------|------|
| **MUST** | Tela única em `/login` com um campo — "E-mail ou CPF" — sem exigir senha |
| **MUST** | Backend busca em `clients` por `email` OU por `document` normalizado (sem pontuação), aceitando CPF com ou sem máscara |
| **MUST** | CPF nunca funciona como credencial — é só chave de busca; o link/código de acesso é sempre enviado ao e-mail já cadastrado em `clients.email`, exibido mascarado na tela (ex.: `f***@gmail.com`) |
| **MUST** | Se o `clients` encontrado ainda não tem `user_id`: criar `auth.users` (Admin API) e vincular `clients.user_id` numa única operação atômica — sem depender do fluxo de convite por e-mail separado hoje existente |
| **MUST** | Se o `clients` encontrado já tem `user_id`: apenas disparar magic link (`signInWithOtp`) para login recorrente, sem recriar usuário |
| **MUST** | Se não existir `clients` com aquele e-mail/CPF: exibir mensagem genérica ("cadastro não encontrado, fale com o laboratório") — sem permitir autocadastro |
| **MUST** | Após o clique no link (`/auth/callback`, já existente), o cliente cai exatamente na visão `/portal/dashboard` de hoje — nenhuma mudança na experiência pós-login |
| **SHOULD** | Sincronizar o trigger `handle_new_user()` de produção com a migration tracked, removendo o `EXCEPTION WHEN OTHERS THEN RETURN NEW` que engole erros silenciosamente |
| **SHOULD** | Normalizar o armazenamento/comparação de `clients.document` (remover pontuação) com índice para busca eficiente e correta |
| **COULD** | Manter o login com senha (`signInWithPassword`) como caminho alternativo para quem já definiu senha, sem remover o que existe |
| **COULD** | Rate limiting no endpoint de busca/envio de link, para mitigar abuso (envio em massa de e-mails, tentativas repetidas) |

---

## Success Criteria

- [ ] Cliente pré-cadastrado acessa o portal em no máximo 2 passos (digitar e-mail/CPF → clicar no link recebido), sem preencher nenhum outro campo
- [ ] 100% dos "primeiros acessos" resultam em `clients.user_id` corretamente preenchido (vinculação atômica — zero contas órfãs com `user_id` setado mas sem `profiles`, ou vice-versa)
- [ ] 0 casos em que o acesso é concedido só com base no CPF, sem confirmação via clique no link enviado ao e-mail cadastrado
- [ ] Busca por CPF funciona independente de o valor estar com ou sem máscara (`123.456.789-00` e `12345678900` retornam o mesmo registro)

---

## Acceptance Tests

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| AT-001 | Primeiro acesso via e-mail | Cliente pré-cadastrado em `clients` (email preenchido, `user_id` null) | Ele digita o e-mail em `/login` | Sistema cria `auth.users`, vincula `clients.user_id` atomicamente, envia magic link ao e-mail; ao clicar, cai em `/portal/dashboard` |
| AT-002 | Primeiro acesso via CPF (com máscara) | Mesmo cenário do AT-001, cliente digita `document` com pontuação | Ele submete o CPF formatado | Sistema normaliza, encontra o registro, mostra e-mail mascarado na tela e envia o link para ele |
| AT-003 | Login recorrente | Cliente já tem `clients.user_id` vinculado | Ele digita e-mail ou CPF novamente | Sistema apenas envia magic link (`signInWithOtp`); nenhum novo `auth.users` é criado |
| AT-004 | Cadastro inexistente | Nenhum `clients` corresponde ao e-mail/CPF informado | Usuário submete o formulário | Sistema exibe mensagem genérica "cadastro não encontrado, fale com o laboratório"; nenhum acesso ou e-mail é criado |
| AT-005 | CPF sem máscara | Mesmo cenário do AT-001/AT-002 | Cliente digita CPF sem pontuação (`12345678900`) | Sistema encontra o mesmo registro que encontraria com o CPF formatado |
| AT-006 | Trigger corrigido | `auth.users` é criado via Admin API durante o primeiro acesso | Trigger `handle_new_user` dispara | Uma linha em `profiles` é criada com sucesso e o erro (se houver) não é silenciosamente engolido |

---

## Out of Scope

- Autocadastro público de clientes — só o `lab_admin` cria registros em `clients` (via `/api/clients`, já existente)
- Remoção do login com senha (`signInWithPassword`) já implementado — mantido como fallback, não é foco desta feature
- Autenticação via SMS/WhatsApp ou uso do CPF como OTP em si — o e-mail continua sendo o único canal de entrega do link/código
- Redesenho visual ou funcional do portal (`/portal/*`) — a visão pós-login permanece exatamente a mesma de hoje
- Multi-fator de autenticação adicional além do link por e-mail
- Fluxo tradicional de "esqueci minha senha" — não é foco (login passwordless substitui a necessidade dele para o caminho principal)

---

## Constraints

| Type | Constraint | Impact |
|------|------------|--------|
| Technical | Deve usar Supabase Auth já em uso (magic link/OTP via `signInWithOtp` e Admin API `auth.admin.createUser`) | Não introduzir novo provedor de autenticação |
| Technical | Deve reaproveitar `clients.document`, `clients.email`, `clients.user_id` e `profiles` sem quebrar as RLS policies existentes (`20260620000002_rls_policies.sql`) | Qualquer migração deve ser aditiva (índice/normalização), não destrutiva |
| Resource | Stack 100% gratuita (Supabase free tier + Resend) — ver memória `project_camarao_camarada` | Não pode introduzir serviço pago de SMS/OTP |
| Data | `clients.document` hoje é `TEXT` livre, sem normalização nem índice, com registros existentes potencialmente com/sem máscara | Precisa de normalização (e possivelmente migração de dados existentes) antes da busca por CPF funcionar de forma confiável |

---

## Technical Context

| Aspect | Value | Notes |
|--------|-------|-------|
| **Deployment Location** | `src/app/login/page.tsx` (nova UI de campo único), novo endpoint `src/app/api/auth/access-request/route.ts` (ou similar — busca + criação/vínculo + envio de link), `supabase/migrations/` (nova migration), `src/app/auth/callback/route.ts` (reaproveitado sem mudança) | Middleware (`src/middleware.ts`) e portal (`src/app/portal/*`) não devem precisar mudar |
| **KB Domains** | `supabase` (Auth, RLS, migrations) | Consultar padrões de Admin API, `signInWithOtp`, e RLS ao desenhar o endpoint |
| **IaC Impact** | Modify existing | Nova migration SQL: normalização/índice funcional em `clients.document`; correção do trigger `handle_new_user()` em produção para sincronizar com a migration tracked. Nenhuma infraestrutura nova — Supabase free tier já em uso |

**Data Contract:** Não aplicável — esta feature não envolve pipeline de dados/ETL; as mudanças de schema (normalização/índice de `clients.document`, correção do trigger) estão cobertas em Technical Context e Constraints acima.

---

## Assumptions

| ID | Assumption | If Wrong, Impact | Validated? |
|----|------------|------------------|------------|
| A-001 | O e-mail cadastrado em `clients.email` é válido e monitorado pelo cliente (hoje não há verificação de posse de e-mail) | Cliente nunca recebe o link e fica bloqueado — precisa de canal alternativo de suporte manual com o laboratório | [ ] |
| A-002 | Registros existentes em `clients.document` podem estar com ou sem máscara de forma inconsistente | Se já estiverem normalizados, o passo de migração de dados existentes é desnecessário — só a validação de novos registros precisa mudar | [ ] |
| A-003 | Volume de clientes é baixo (até 50, conforme escopo do MVP) — não há necessidade de rate limiting agressivo no lançamento | Em maior escala, o endpoint de busca por e-mail/CPF pode virar alvo de abuso ou enumeration | [ ] |
| A-004 | A correção do trigger `handle_new_user()` (SHOULD) precisa entrar junto com esta feature para a criação atômica de `auth.users` + `profiles` funcionar de forma confiável | Se tratado como fora de escopo, a vinculação atômica prometida nos MUSTs fica sujeita ao mesmo bug já documentado, comprometendo o critério de sucesso "100% dos primeiros acessos" | [ ] |
| A-005 | Mostrar mensagem distinta para "cadastro não encontrado" (em vez de uma mensagem idêntica à de sucesso) é aceitável dado que não há autocadastro público e a base é pequena (~50 clientes, todos cadastrados manualmente pelo laboratório) | Se o produto crescer além do MVP B2B controlado, esse comportamento habilita enumeração de e-mail/CPF cadastrados — reavaliar mensagem genérica única nesse cenário | [ ] |

---

## Clarity Score Breakdown

| Element | Score (0-3) | Notes |
|---------|-------------|-------|
| Problem | 3 | Causa raiz específica (trigger frágil + vinculação não-transacional + fricção de senha), com impacto claro nos dois personas |
| Users | 3 | Dois personas identificados com pain points concretos e distintos |
| Goals | 3 | MoSCoW completo, comportamentos específicos e verificáveis (não vagos) |
| Success | 3 | Critérios mensuráveis com números/percentuais e testáveis via os Acceptance Tests |
| Scope | 3 | Out of Scope explícito e não-trivial (6 itens), delimitando claramente o que não muda |
| **Total** | **15/15** | |

**Minimum to proceed: 12/15** — atingido.

---

## Open Questions

None - ready for Design.

Nota para a fase de Design: decidir entre `signInWithOtp` (magic link clicável) vs. código numérico (OTP de 6 dígitos) como mecanismo de entrega — o Goals acima assume link clicável (reaproveitando `/auth/callback` existente), mas um código curto também atende ao requisito e pode ser mais amigável em mobile. Também decidir o nome final do endpoint e se o "COULD" de rate limiting entra nesta rodada ou fica para depois.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-13 | define-agent | Initial version, a partir da proposta discutida com o usuário |
| 1.1 | 2026-08-14 | ship-agent | Shipped and archived |

---

## Next Step

**Ready for:** `/ship .claude/sdd/features/DEFINE_CLIENT_PASSWORDLESS_ACCESS.md`
