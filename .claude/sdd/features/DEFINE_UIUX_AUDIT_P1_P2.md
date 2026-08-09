# DEFINE: Auditoria UI/UX — Correções P1 + P2

> Fechar os 9 achados de atrito e polimento (P1 + P2) da auditoria combinada UI/UX do portal Camarão Camarada, complementando os 8 achados P0 já implementados e publicados em produção.

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | UIUX_AUDIT_P1_P2 |
| **Date** | 2026-08-09 |
| **Author** | define-agent (via Claude Code) |
| **Status** | ✅ Complete (Built) |
| **Clarity Score** | 15/15 |

---

## Problem Statement

Mesmo após a correção dos 8 achados P0 (fundação visual, orientação de alertas, tabelas responsivas, confirmação de formulários, edição de análise), a auditoria combinada UI/UX identificou 9 achados adicionais que continuam gerando atrito para os dois perfis de usuário do portal: o fazendeiro (cliente, não-técnico) percebe a interface como lenta/incerta em conexões ruins e não entende parâmetros técnicos nem confia no gráfico do viveiro quando ele abre no parâmetro errado; o técnico do laboratório só descobre um valor fora da faixa depois de enviar o formulário inteiro. Sem esses ajustes, o produto entrega a informação certa (resolvido no P0) mas ainda com fricção suficiente para prejudicar a confiança e a adoção contínua do portal.

---

## Target Users

| User | Role | Pain Point |
|------|------|------------|
| Fazendeiro (cliente) | Consome resultados no Portal do Cliente, não-técnico, frequentemente em campo/mobile | Tela em branco em conexão lenta (#2); nomes técnicos de parâmetros sem explicação (#4); gráfico do viveiro abre no parâmetro errado, escondendo o que está em alerta (#6); estados vazios não dizem quando esperar a próxima análise (#9); menu mobile quebra com nome de empresa longo (#5) |
| Técnico do laboratório (lab_admin) | Cadastra análises via formulário de 2 etapas no Painel do Laboratório, geralmente em série (várias análises seguidas) | Só descobre um valor fora da faixa depois de enviar o formulário inteiro, sem sinal em tempo real (#3); paleta de marca inconsistente entre telas do admin dificulta reconhecimento visual rápido de status (#1) |

---

## Goals

What success looks like (prioritized):

| Priority | Goal |
|----------|------|
| **MUST** | Gráfico do viveiro seleciona por padrão o parâmetro mais recente em alerta, não o primeiro por `display_order` (#6) |
| **MUST** | Toda rota assíncrona sob `src/app/admin/**` e `src/app/portal/**` que busca dados no Supabase exibe um `loading.tsx` com skeleton, nunca tela em branco (#2) |
| **SHOULD** | Badges e indicadores de status usam a paleta de marca (`seagreen`/`ocean`) em vez de verde/vermelho/amarelo genéricos do Tailwind (#1) |
| **SHOULD** | Formulário de análise sinaliza em tempo real (antes do envio) quando um valor digitado está fora da faixa de referência (#3) |
| **SHOULD** | Cada parâmetro na tabela de resultados tem uma descrição leiga de uma linha acessível (tooltip ou linha expansível) para o fazendeiro não-técnico (#4) |
| **SHOULD** | Menu mobile não fica sobreposto ou cortado quando o header quebra linha (nome de cliente/empresa longo) (#5) |
| **COULD** | Eixo Y do gráfico de parâmetro se adapta a telas estreitas (<360px) sem cortar espaço útil (#7) |
| **COULD** | Escala tipográfica para números de destaque (stat cards) formalizada em `tailwind.config.ts` (#8) |
| **COULD** | Estados vazios do portal do cliente indicam quando esperar a próxima análise (#9) |

**Priority Guide:**
- **MUST** = MVP fails without this
- **SHOULD** = Important, but workaround exists
- **COULD** = Nice-to-have, cut first if needed

---

## Success Criteria

Measurable outcomes:

- [ ] 2/2 itens MUST implementados e verificados manualmente nas rotas afetadas
- [ ] 4/4 itens SHOULD implementados e verificados manualmente
- [ ] 3/3 itens COULD implementados (ou explicitamente cortados com justificativa, se o tempo apertar)
- [ ] Gráfico do viveiro abre no parâmetro em alerta em 100% dos casos de teste onde existe ao menos um `is_alert = true` na análise mais recente do viveiro (hoje: 0%, sempre abre o primeiro por `display_order`)
- [ ] 100% das rotas Server Component sob `src/app/admin/**` e `src/app/portal/**` que fazem `await supabase...` têm um `loading.tsx` irmão no mesmo diretório de rota
- [ ] `npm run build` conclui sem novos erros de compilação além dos já pré-existentes (tracked na sessão do P0)
- [ ] Checklist manual de regressão nas 6 páginas tocadas pelo P0 (login, dashboard admin, dashboard portal, tabela de resultados, formulário de análise, menu mobile) — 0 regressões visuais/funcionais

---

## Acceptance Tests

| ID | Scenario | Given | When | Then |
|----|----------|-------|------|------|
| AT-001 | Gráfico abre no parâmetro certo | Um viveiro com a análise mais recente contendo ao menos 1 resultado com `is_alert = true` | O fazendeiro abre `/portal/ponds/[id]` | O gráfico carrega já selecionado no parâmetro em alerta mais recente, não no primeiro por `display_order` |
| AT-002 | Gráfico sem alerta mantém comportamento atual | Um viveiro cuja análise mais recente não tem nenhum resultado em alerta | O fazendeiro abre `/portal/ponds/[id]` | O gráfico abre no primeiro parâmetro por `display_order` (comportamento inalterado quando não há alerta) |
| AT-003 | Loading state em conexão lenta | Uma rota assíncrona (ex.: `/portal/dashboard`) com o Supabase respondendo com latência perceptível | O fazendeiro navega para a rota | Um skeleton no formato da grade de cards aparece antes do conteúdo real, nunca tela em branco |
| AT-004 | Feedback em tempo real no formulário de análise | O técnico está na etapa 2 do formulário de análise, parâmetro com `ref_max` definido | Ele digita um valor acima do `ref_max` no campo | O campo é sinalizado visualmente (cor de alerta) antes de qualquer envio |
| AT-005 | Camada de linguagem simples por parâmetro | A tabela de resultados exibe "Alcalinidade" (ou outro parâmetro técnico) | O fazendeiro interage com o nome do parâmetro (toque ou hover) | Uma descrição leiga de uma linha aparece, sem navegação para outra tela |
| AT-006 | Menu mobile não quebra com nome longo | Um cliente com `company_name` longo o suficiente para quebrar linha no header mobile | O fazendeiro abre o menu mobile | O painel do menu não fica sobreposto nem cortado pelo header, independente da altura do header |

---

## Out of Scope

Explicitly NOT included in this feature:

- Os 8 achados P0 (já implementados e em produção — fundação shadcn, callout "o que fazer", tabelas responsivas, toasts de sucesso, edição de análise)
- Migrar 100% dos componentes restantes do app para os primitivos shadcn/ui (fora do escopo desta rodada; a fundação já foi criada no P0 e será adotada incrementalmente)
- Testes automatizados (E2E ou de regressão visual) para os itens de UI — verificação manual é suficiente para o tamanho atual do MVP (1 laboratório, ≤50 clientes)
- Adicionar `ConfirmDialog` a ações destrutivas — não há nenhuma ação destrutiva reachable na UI hoje (achado do P0, permanece fora de escopo até essa funcionalidade existir)
- Corrigir a `SUPABASE_SERVICE_ROLE_KEY` inválida em `.env.local` — achado de uma conversa anterior, não relacionado a UI/UX
- Nova auditoria de acessibilidade WCAG 2.2 além do que os 9 itens já cobrem — mereceria um ciclo próprio

---

## Constraints

| Type | Constraint | Impact |
|------|------------|--------|
| Technical | Deve reaproveitar os primitivos shadcn/ui já criados no P0 (`Button`, `Badge`, `Skeleton`, `Card`, etc.) e a paleta `ocean`/`seagreen` já definida em `tailwind.config.ts` | Evita duplicar padrões visuais; Design phase deve mapear cada item aos componentes existentes antes de propor novos |
| Technical | Stack fixa: Next.js 14 App Router + React Server Components + Supabase + Tailwind — sem novas dependências além das já instaladas (`lucide-react`, Radix, `recharts`) | Mantém o critério "100% gratuito" e stack unificada em TypeScript (ver `[[project_camarao_camarada]]`) |
| Technical | O item #6 (parâmetro padrão do gráfico) depende de uma query adicional ou de reordenar os dados já buscados em `portal/ponds/[id]/page.tsx` — sem criar nova tabela ou coluna | Design deve decidir entre computar no server component ou no client (`parameter-chart.tsx`) |
| Resource | MVP de 1 laboratório / até 50 clientes, sem orçamento para ferramentas pagas de design, monitoramento ou testes visuais | Restringe a abordagem a soluções nativas do stack já aprovado |

---

## Technical Context

> Essential context for Design phase - prevents misplaced files and missed infrastructure needs.

| Aspect | Value | Notes |
|--------|-------|-------|
| **Deployment Location** | `src/app/**` (novos `loading.tsx` por rota), `src/components/**` (ajustes em `alert-badge.tsx`, `analysis-form.tsx`, `analysis-results-table.tsx`, `mobile-nav.tsx`, `parameter-chart.tsx`, `admin-dashboard`), `tailwind.config.ts` | Mesma estrutura de projeto usada no P0 — nenhum diretório novo necessário |
| **KB Domains** | `ui-ux` (patterns: `responsive-layout`, `interaction-states`, `theming-and-dark-mode`; concepts: `design-tokens`, `usability-heuristics`, `responsive-design`); `supabase` (para a query de "parâmetro mais recente em alerta") | Design phase deve consultar `ui-ux/patterns/interaction-states.md` para o feedback em tempo real do formulário (#3) e `ui-ux/concepts/design-tokens.md` para a consolidação de paleta (#1) |
| **IaC Impact** | None | Nenhuma migration de schema nova; reaproveita `parameters.description` já existente (mesmo campo usado no callout do P0) para a descrição leiga (#4) |

**Why This Matters:**

- **Location** → Design phase usa a estrutura de projeto correta, evita arquivos mal posicionados
- **KB Domains** → Design phase puxa os padrões corretos de `ui-ux` e `supabase`
- **IaC Impact** → Nenhum planejamento de infraestrutura adicional necessário; evita falha de "funciona local mas não em produção"

---

## Data Contract (if applicable)

N/A — esta feature não introduz pipelines de dados novos. Reaproveita as tabelas Supabase já existentes (`parameters`, `analyses`, `analysis_results`, `ponds`) sem novas colunas ou migrations. O item #6 (parâmetro em alerta) é uma leitura adicional sobre dados já buscados, não uma nova fonte de dados.

---

## Assumptions

Assumptions that if wrong could invalidate the design:

| ID | Assumption | If Wrong, Impact | Validated? |
|----|------------|------------------|------------|
| A-001 | A paleta `seagreen` já definida em `tailwind.config.ts` (50/100/500/600/700) tem contraste suficiente para uso em badges de status sem ajuste adicional | Precisaria de uma iteração de cor (novos tons) antes de aplicar no item #1 | [ ] |
| A-002 | Os Server Components afetados (dashboards, listagens) têm latência perceptível o suficiente em produção para justificar skeleton — não é sempre <200ms | Se a resposta do Supabase for sempre quase instantânea, o esforço do item #2 tem retorno menor (mas ainda vale como salvaguarda de rede lenta no celular em campo) | [ ] |
| A-003 | "Parâmetro mais recente em alerta" (#6) é definido como o parâmetro com `is_alert = true` na análise mais recente do viveiro — não uma agregação histórica de alertas recorrentes | Se errado, a lógica de seleção do gráfico e o critério de "recente" mudam | [ ] |
| A-004 | O texto de descrição leiga por parâmetro (#4) pode reaproveitar o mesmo campo `parameters.description` já usado no callout "O que fazer" do P0, sem precisar de uma segunda coluna dedicada | Se o texto de alerta e o texto de "o que é este parâmetro" precisarem ser diferentes, será necessária nova coluna + migration | [ ] |
| A-005 | Verificação manual (sem testes automatizados) é aceitável para validar os 9 itens antes de considerar a feature pronta, dado o tamanho do time (1 pessoa) e do MVP | Se o app crescer além de 50 clientes ou ganhar mais colaboradores, a falta de testes automatizados de UI vira dívida técnica relevante | [ ] |

**Note:** Validate critical assumptions before DESIGN phase. Unvalidated assumptions become risks.

---

## Clarity Score Breakdown

| Element | Score (0-3) | Notes |
|---------|-------------|-------|
| Problem | 3 | Herdado de uma auditoria já verificada contra o código real (file:line citado em cada achado), com impacto específico por persona |
| Users | 3 | Duas personas nomeadas (fazendeiro, técnico do laboratório) com pain points distintos e rastreáveis a itens específicos |
| Goals | 3 | 9 metas com prioridade MoSCoW explícita, cada uma ligada a um achado numerado e a um arquivo/linha |
| Success | 3 | Critérios numéricos (2/2, 4/4, 3/3, 100%, 0 regressões) mais 6 acceptance tests testáveis em Given/When/Then |
| Scope | 3 | Exclusões explícitas, incluindo por que cada uma foi deixada de fora (P0 já feito, ConfirmDialog sem alvo, chave Supabase é assunto separado) |
| **Total** | **15/15** | Input já veio estruturado como auditoria com file:line, o que elevou a clareza de cada elemento acima do típico |

**Scoring Guide:**
- 0 = Missing entirely
- 1 = Vague or incomplete
- 2 = Clear but missing details
- 3 = Crystal clear, actionable

**Minimum to proceed: 12/15**

---

## Open Questions

Nenhuma bloqueante para o Design — mas duas decisões de implementação ficam explicitamente para a fase de Design (não antecipadas aqui, por serem detalhes de solução, não de requisito):

1. Item #4 (descrição leiga por parâmetro): tooltip on-hover (melhor para desktop) vs. linha expansível (melhor para toque/mobile) vs. os dois. A Design phase deve decidir com base no padrão `ui-ux/patterns` mais adequado ao contexto mobile-first do fazendeiro.
2. Item #2 (loading states): um `loading.tsx` por rota individual vs. um componente `Skeleton` compartilhado parametrizado por layout de grade. A Design phase deve avaliar reuso vs. duplicação.

None - ready for Design.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-08-09 | define-agent | Versão inicial — captura dos 9 achados P1+P2 da auditoria UI/UX combinada, complementando o P0 já implementado |

---

## Next Step

**Ready for:** `/ship .claude/sdd/features/DEFINE_UIUX_AUDIT_P1_P2.md`
