# BRAINSTORM: Camarão Camarada — Portal de Qualidade da Água

> Exploratory session to clarify intent and approach before requirements capture

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | CAMARAO_CAMARADA |
| **Date** | 2026-06-20 |
| **Author** | brainstorm-agent |
| **Status** | Ready for Define |

---

## Initial Idea

**Raw Input:**
> App web para laboratórios de análise de fazendas de camarão. Transforma análises laboratoriais em informação para o cliente (fazendeiro), funcionando como portal de monitoramento da qualidade da água. MVP com: cadastro de clientes/fazendas/viveiros, registro de análises, histórico, gráficos de evolução, alertas automáticos, geração de PDF e comparação entre análises. Ferramentas 100% gratuitas. Visual bonito, responsivo, seguro. Nome: Camarão Camarada.

**Context Gathered:**
- Projeto novo, sem código existente
- Arquivo `testes_camarao.md` documenta 25 parâmetros de qualidade da água para carcinicultura (cultivo de camarão)
- Parâmetros organizados em 4 categorias: campo, laboratório, microbiológico, contaminantes
- Valores de referência definidos para parâmetros-chave (Litopenaeus vannamei)

**Technical Context Observed:**

| Aspect | Observation | Implication |
|--------|-------------|-------------|
| Stack existente | Nenhum | Liberdade total de escolha |
| Plataforma alvo | Web (responsivo) | Next.js + Tailwind cobre mobile |
| Deploy | Gratuito obrigatório | Vercel + Supabase free tier |
| Perfil técnico | Iniciante / AI-assisted | Stack simples, bem documentado, TypeScript end-to-end |

---

## Discovery Questions & Answers

| # | Question | Answer | Impact |
|---|----------|--------|--------|
| 1 | Quem são os usuários e como o fluxo funciona? | Laboratório registra dados → Cliente visualiza portal | Dois papéis distintos (admin-lab / viewer-client), RLS essencial |
| 2 | Qual é a escala esperada para o MVP? | 1 laboratório, até 50 clientes | Supabase free tier (500MB) é suficiente; sem necessidade de sharding |
| 3 | Qual o perfil técnico do desenvolvedor? | Iniciante / AI-assisted | Stack unificado TypeScript, menos partes móveis, deploy automático |
| 4 | Como os alertas devem funcionar? | Painel visual (destaque em vermelho) + e-mail automático | Necessita serviço de e-mail; Resend free tier (100/dia) |
| 5 | Parâmetros de análise fixos ou configuráveis? | Configuráveis (admin pode adicionar/remover/editar) | Tabela `parameters` separada; seed com os 25 parâmetros do testes_camarao.md |

---

## Sample Data Inventory

| Type | Location | Count | Notes |
|------|----------|-------|-------|
| Parâmetros de análise | `testes_camarao.md` | 25 | Nome, tipo, unidade, valores de referência, método |
| Dados reais de análise | N/A | 0 | Nenhum histórico disponível — usar dados fictícios nos seeds de desenvolvimento |

**Como os samples serão usados:**
- `testes_camarao.md` → seed data da tabela `parameters` (nome, unidade, ref_min, ref_max, categoria)
- Valores de referência do arquivo → base para o mecanismo de alertas automáticos

---

## Approaches Explored

### Approach A: Next.js + Supabase + Vercel ⭐ Recommended

**Description:** Stack full-stack TypeScript unificado. Next.js 14 (App Router) para frontend e API Routes. Supabase para banco (PostgreSQL), autenticação, RLS e storage. Vercel para hospedagem com deploy automático via GitHub. Resend para e-mails transacionais.

| Camada | Tecnologia | Custo |
|--------|-----------|-------|
| Frontend + API | Next.js 14 + TypeScript | Grátis |
| Banco + Auth + RLS | Supabase | Grátis (500MB, 50k req/mês) |
| UI Components | shadcn/ui + Tailwind CSS | Grátis |
| Gráficos | Recharts | Grátis |
| PDF | jsPDF + html2canvas | Grátis |
| E-mail | Resend | Grátis (100/dia) |
| Hospedagem | Vercel | Grátis |

**Pros:**
- Uma única base de código TypeScript (sem troca de linguagem)
- Deploy automático a cada push no GitHub
- Supabase Auth + RLS elimina necessidade de lógica de segurança manual
- shadcn/ui entrega visual profissional e acessível com componentes prontos
- Recharts cobre gráficos de séries temporais com facilidade
- Padrões amplamente documentados — ideal para manutenção assistida por IA

**Cons:**
- Next.js App Router tem curva de aprendizado (Server Components vs Client Components)
- Resend: 100 e-mails/dia é suficiente para MVP mas pode limitar crescimento
- Supabase free tier pausa projetos inativos após 7 dias (contornável com ping automático)

**Why Recommended:** Menor número de partes móveis, stack consolidado, gratuito dentro da escala do MVP, e extremamente bem suportado por ferramentas de IA (Copilot, Claude Code, v0.dev).

---

### Approach B: React SPA + Express.js + Railway

**Description:** Frontend React (Vite) no Vercel, backend Express.js separado no Railway, PostgreSQL no Railway.

**Pros:**
- Mais controle sobre a API
- Flexibilidade para adicionar lógica customizada no backend

**Cons:**
- Railway free tier tem $5/mês em crédito — pode acabar com uso real
- Dois repositórios ou monorepo mais complexo
- Autenticação precisa ser implementada do zero (JWT, bcrypt, sessões)
- Mais partes para quebrar e manter

---

### Approach C: Django + React + Supabase

**Description:** Backend Python/Django para API e admin, frontend React separado, Supabase para banco.

**Pros:**
- Django Admin pronto para cadastros internos do laboratório
- Ecossistema Python robusto para análise de dados

**Cons:**
- Duas linguagens (Python + JavaScript) = manutenção mais difícil com IA
- Django Admin tem visual antiquado — vai contra requisito de "visual bonito"
- Deploy de Python no Vercel é trabalhoso; Railway tem limitação de custo
- Muito mais configuração para o mesmo resultado

---

## Selected Approach

| Attribute | Value |
|-----------|-------|
| **Chosen** | Approach A — Next.js + Supabase + Vercel |
| **User Confirmation** | 2026-06-20 |
| **Reasoning** | Stack unificado, gratuito, menor complexidade operacional, ideal para manutenção assistida por IA |

---

## Key Decisions Made

| # | Decision | Rationale | Alternative Rejected |
|---|----------|-----------|----------------------|
| 1 | Dois perfis de usuário: `lab_admin` e `client` | Laboratório insere, cliente visualiza — papéis distintos com permissões diferentes | Acesso único (admin só) |
| 2 | Parâmetros configuráveis via tabela `parameters` | Flexibilidade para o laboratório customizar seus testes; seed com 25 do testes_camarao.md | Parâmetros hardcoded no código |
| 3 | Alertas visuais + e-mail via Resend | Notificação passiva (painel) + ativa (e-mail) = cliente sempre informado | Apenas visual, sem e-mail |
| 4 | PDF via jsPDF/html2canvas | Biblioteca client-side, sem servidor extra | Puppeteer (requer Node.js server separado) |
| 5 | Supabase RLS para segurança de dados | Cada cliente vê apenas suas fazendas/análises; segurança na camada de banco | Middleware de autorização manual |

---

## Data Model (Sketch)

```
auth.users (Supabase Auth)
    ↓
profiles          → user_role: 'lab_admin' | 'client'
clients           → id, user_id (FK profiles), name, email, phone, created_at
farms (fazendas)  → id, client_id, name, location, area_ha
ponds (viveiros)  → id, farm_id, name, area_m2, species, system_type
parameters        → id, name, unit, category, ref_min, ref_max, description
analyses          → id, pond_id, collected_at, analyzed_at, technician, notes
analysis_results  → id, analysis_id, parameter_id, value, is_alert
```

**Fluxo principal:**
```
Lab Admin registra análise → sistema compara valores com ref_min/ref_max
→ marca is_alert=true nos resultados fora do range
→ dispara e-mail via Resend para o cliente do viveiro
→ cliente acessa portal e vê gráficos + histórico com destaque visual nos alertas
```

---

## Features Removed (YAGNI)

| Feature Sugerida | Razão Removida | Pode Adicionar Depois? |
|------------------|----------------|------------------------|
| Notificação por WhatsApp | Integração com WhatsApp Business API tem custo e complexidade elevados | Sim, pós-MVP |
| App mobile nativo | Web responsivo cobre 100% dos casos de uso mobile no MVP | Sim, fase 3 |
| Export para Excel/CSV | PDF cobre a necessidade de relatório; Excel adiciona dependência | Sim, fácil de adicionar |
| Multi-laboratório (SaaS) | Fora do escopo do MVP; requer lógica de tenant isolation mais complexa | Sim, escala futura |
| Integração com equipamentos de medição | Complexidade de hardware integration; fora do MVP | Sim, roadmap futuro |
| Dashboard com mapas geoespaciais das fazendas | Luxo para MVP; Mapbox/Google Maps tem custo | Sim, com Leaflet.js (gratuito) |

---

## Parâmetros de Análise (Seed Data)

25 parâmetros identificados em `testes_camarao.md`:

| # | Nome | Unidade | Categoria | Ref. Min | Ref. Max |
|---|------|---------|-----------|----------|---------|
| 1 | Temperatura | °C | campo | 22.5 | 28.8 |
| 2 | Oxigênio Dissolvido | mg/L | campo | 5 | — |
| 3 | pH | — | campo | 7.5 | 8.5 |
| 4 | Salinidade | ppt | campo | 10 | 25 |
| 5 | Transparência | cm | campo | — | — |
| 6 | ORP | mV | campo | — | — |
| 7 | Condutividade | µS/cm | campo | — | — |
| 8 | Alcalinidade | mg/L CaCO₃ | laboratorio | 120 | 220 |
| 9 | Dureza | mg/L CaCO₃ | laboratorio | — | — |
| 10 | Amônia Total (TAN) | mg/L | laboratorio | — | 1 |
| 11 | Amônia Não Ionizada (NH₃) | mg/L | laboratorio | — | — |
| 12 | Nitrito (NO₂⁻) | mg/L | laboratorio | — | 20 |
| 13 | Nitrato (NO₃⁻) | mg/L | laboratorio | — | 200 |
| 14 | Nitrogênio Total | mg/L | laboratorio | — | — |
| 15 | Fosfato (PO₄³⁻) | mg/L | laboratorio | — | — |
| 16 | Fósforo Total | mg/L | laboratorio | — | — |
| 17 | Clorofila-a | µg/L | laboratorio | — | — |
| 18 | Sólidos Suspensos Totais (SST) | mg/L | laboratorio | 300 | 500 |
| 19 | DBO | mg/L O₂ | laboratorio | — | — |
| 20 | DQO | mg/L O₂ | laboratorio | — | — |
| 21 | Vibrio spp. | UFC/mL | microbiologico | — | — |
| 22 | Coliformes | NMP/100mL | microbiologico | — | — |
| 23 | Bactérias Heterotróficas | UFC/mL | microbiologico | — | — |
| 24 | Metais Pesados | variável | contaminantes | — | — |
| 25 | Resíduos de Agrotóxicos | variável | contaminantes | — | — |

---

## Incremental Validations

| Section | Presented | User Feedback | Adjusted? |
|---------|-----------|---------------|-----------|
| Arquitetura e fluxo de usuários | ✅ | Aprovado: Lab registra → Cliente visualiza | Não |
| Stack tecnológico (Abordagem A) | ✅ | Aprovado: Next.js + Supabase + Vercel | Não |
| Parâmetros configuráveis vs fixos | ✅ | Ajuste: configuráveis (não fixos) | Sim — modelo de dados adaptado |
| Features do MVP vs YAGNI | ✅ | Manter todas as 9 features do MVP | Não |

---

## Suggested Requirements for /define

### Problem Statement (Draft)
Laboratórios de análise de água para carcinicultura precisam de uma plataforma para registrar análises laboratoriais e disponibilizar os resultados como informação acionável para seus clientes (fazendeiros), com histórico, gráficos de evolução e alertas automáticos quando parâmetros saem dos valores de referência.

### Target Users (Draft)

| Usuário | Pain Point |
|---------|------------|
| **Técnico do laboratório (lab_admin)** | Processo manual e fragmentado de comunicar resultados ao cliente; sem histórico centralizado |
| **Fazendeiro/cliente (client)** | Recebe resultados em PDF avulso sem contexto de evolução; não sabe quando há risco na água do viveiro |

### Success Criteria (Draft)

- [ ] Técnico do laboratório consegue cadastrar cliente, fazenda, viveiro e registrar análise em menos de 5 minutos
- [ ] Cliente acessa portal e visualiza histórico de resultados e gráficos de evolução do viveiro
- [ ] Sistema detecta automaticamente valores fora do range e envia e-mail de alerta ao cliente
- [ ] Relatório PDF de análise pode ser gerado com 1 clique
- [ ] Interface acessível em mobile (responsive)
- [ ] Deploy 100% gratuito funcionando em produção

### Constraints Identified

- **Custo:** Stack 100% gratuito (Vercel + Supabase free tier + Resend free tier)
- **Escala:** MVP para 1 laboratório e até 50 clientes
- **Manutenção:** Código assistido por IA — preferência por TypeScript unificado
- **Segurança:** Row Level Security (RLS) no Supabase para isolamento de dados por cliente
- **E-mail:** Máximo 100 e-mails/dia no plano gratuito do Resend

### Out of Scope (Confirmed)

- Multi-laboratório / SaaS multitenancy
- Notificações por WhatsApp
- App mobile nativo
- Export para Excel/CSV
- Integração com equipamentos de medição
- Mapas geoespaciais das fazendas
- Múltiplos idiomas (internacionalização)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Camarão Camarada                        │
│                  (Next.js 14 App Router)                    │
├────────────────────┬────────────────────────────────────────┤
│   /admin/*         │   /portal/*                            │
│   (lab_admin)      │   (client)                             │
│                    │                                        │
│ • Cadastrar cliente│ • Dashboard com alertas                │
│ • Cadastrar fazenda│ • Histórico por viveiro                │
│ • Cadastrar viveiro│ • Gráficos de evolução                 │
│ • Registrar análise│ • Comparação entre análises            │
│ • Gerir parâmetros │ • Geração de PDF                       │
│ • Geração de PDF   │                                        │
└────────────┬───────┴───────────────┬────────────────────────┘
             │                       │
             ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Backend)                       │
│                                                             │
│  Auth  │  PostgreSQL (RLS)  │  Storage  │  Edge Functions  │
└─────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Resend (E-mail Alerts)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Session Summary

| Metric | Value |
|--------|-------|
| Questions Asked | 5 |
| Approaches Explored | 3 |
| Features Removed (YAGNI) | 6 |
| Validations Completed | 4 |
| Approach Selected | A — Next.js + Supabase + Vercel |

---

## Next Step

**Ready for:** `/define .claude/sdd/features/BRAINSTORM_CAMARAO_CAMARADA.md`
