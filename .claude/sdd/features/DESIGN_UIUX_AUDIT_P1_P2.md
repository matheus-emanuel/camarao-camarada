# DESIGN: Auditoria UI/UX — Correções P1 + P2

> Especificação técnica para fechar os 9 achados de atrito (P1) e polimento (P2) da auditoria UI/UX do portal Camarão Camarada, complementando o P0 já em produção.

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | UIUX_AUDIT_P1_P2 |
| **Date** | 2026-08-09 |
| **Author** | design-agent (via Claude Code) |
| **DEFINE** | [DEFINE_UIUX_AUDIT_P1_P2.md](./DEFINE_UIUX_AUDIT_P1_P2.md) |
| **Status** | ✅ Complete (Built) |

---

## Architecture Overview

Não há novo serviço ou camada — esta feature é inteiramente composta de ajustes cirúrgicos dentro da arquitetura Next.js App Router + Supabase já estabelecida no P0. O diagrama abaixo mostra os dois fluxos de renderização afetados (Server Component com Suspense, e o único Client Component do app) e onde cada um dos 9 itens se encaixa.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                    FLUXO A — Rotas Server Component (17 de 18)           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [Navegação] → [loading.tsx: <PageSkeleton/>] (#2)                       │
│                        │ (Suspense boundary automático do App Router)     │
│                        ▼                                                  │
│              [page.tsx: Server Component] → [Supabase (RLS)]             │
│                        │                                                  │
│                        ▼                                                  │
│              [Conteúdo real substitui o skeleton]                        │
│                        │                                                  │
│         ┌──────────────┼──────────────────────┐                         │
│         ▼              ▼                       ▼                         │
│  [Badges de status] [Estados vazios com    [Stat cards com               │
│   via seagreen/ocean  expectativa] (#9)      escala tipográfica          │
│   (Badge component,                          formal] (#8)                │
│   item #1)                                                                │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│           FLUXO B — portal/ponds/[id]/page.tsx (único Client Component)  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [Mount] → useEffect → [Supabase: pond + analyses]                       │
│                              │                                            │
│                              ▼                                            │
│              [Supabase: parâmetro mais recente com is_alert=true         │
│               na análise mais recente] (#6, nova query)                  │
│                              │                                            │
│                              ▼                                            │
│         selectedParamId = parâmetro em alerta ?? params_[0].id           │
│                              │                                            │
│         enquanto carrega → <PageSkeleton variant="detail"/> (#2)         │
│                              │                                            │
│                              ▼                                            │
│              <ParameterChart/> com YAxis responsivo (#7)                 │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│              FLUXOS ISOLADOS (sem dependência entre si)                  │
├──────────────────────────────────────────────────────────────────────────┤
│  analysis-form.tsx (etapa 2) → digitação → compara com ref_min/ref_max   │
│  do parâmetro já carregado em memória → sinaliza campo (#3, client-side, │
│  sem round-trip ao servidor)                                             │
│                                                                            │
│  analysis-results-table.tsx → linha expansível por parâmetro → exibe     │
│  parameters.description já carregado (#4, sem nova query)                │
│                                                                            │
│  mobile-nav.tsx → header + painel na mesma coluna flex, sem offset       │
│  fixo em pixels (#5, CSS puro, sem JS de medição)                        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| `PageSkeleton` (novo) | Componente único e reutilizável de loading, com variantes (`grid`, `table`, `detail`, `form`) que espelham o layout real de cada tipo de página | React Server/Client-agnóstico + `Skeleton` (shadcn, já criado no P0) |
| `loading.tsx` × 17 (novo, um por rota Server Component) | Ativa o Suspense boundary nativo do App Router; cada um é um wrapper fino de 3-5 linhas que escolhe a variante de `PageSkeleton` | Next.js 14 App Router convention |
| `portal/ponds/[id]/page.tsx` (modificado) | Único Client Component do app; ganha a query de parâmetro-em-alerta (#6) e troca o texto "Carregando..." por `PageSkeleton variant="detail"` (#2) | React Client Component + `@supabase/ssr` browser client |
| `analysis-form.tsx` (modificado) | Formulário de 2 etapas do técnico; ganha validação client-side em tempo real na etapa 2 | React Client Component (já existente) |
| `analysis-results-table.tsx` (modificado) | Tabela de resultados do fazendeiro; linha de parâmetro vira expansível, reaproveitando `parameters.description` | React Server Component (já existente) |
| `mobile-nav.tsx` (modificado) | Menu mobile; reestruturado para layout de coluna única sem offset mágico | React Client Component (já existente) |
| `parameter-chart.tsx` (modificado) | Gráfico Recharts; eixo Y adapta largura/fonte em telas estreitas | React Client Component (já existente) |
| Migration `20260809000002_parameter_descriptions_full.sql` (novo) | Estende `parameters.description` para os 16 parâmetros que ainda não têm texto (o P0 só cobriu os 9 que disparam alerta) | SQL, mesmo padrão do P0 (`UPDATE ... WHERE name = ...`) |
| `tailwind.config.ts` (modificado) | Ganha uma escala tipográfica nomeada para números de destaque (`fontSize.stat`) | Tailwind config |

---

## Key Decisions

### Decision 1: Componente `PageSkeleton` único e compartilhado, com `loading.tsx` finos por rota

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-08-09 |

**Context:** O App Router do Next.js exige um arquivo `loading.tsx` por segmento de rota para ativar o Suspense boundary automático — não existe forma nativa de compartilhar um único `loading.tsx` entre múltiplas rotas. A DEFINE (Open Question #2) deixou em aberto se cada rota deveria ter sua própria implementação de skeleton ou se deveriam compartilhar um componente.

**Choice:** Um componente `src/components/shared/page-skeleton.tsx` com 3-4 variantes (`grid` para dashboards, `table` para listagens, `detail` para páginas de entidade única, `form` para criação/edição), consumindo o `Skeleton` primitivo já criado no P0. Cada um dos 17 `loading.tsx` vira um arquivo de 3-5 linhas: `export default function Loading() { return <PageSkeleton variant="..." /> }`.

**Rationale:** Resolve a exigência do framework (arquivo por rota) sem duplicar 17 vezes a marcação do skeleton. Trocar o layout de um tipo de página no futuro exige editar um único componente, não 17 arquivos.

**Alternatives Rejected:**
1. Skeleton bespoke por página, replicando exatamente cada layout real — rejeitado por custo de manutenção (17 implementações a manter em sincronia com as páginas reais) desproporcional ao tamanho do time (1 pessoa).
2. Nenhum `loading.tsx`, apenas um spinner genérico central — rejeitado porque não comunica a forma do conteúdo que está chegando (pior "Visibility of System Status", ver `ui-ux/patterns/interaction-states.md`), voltando ao problema original.

**Consequences:**
- Aceita-se que as 4 variantes sejam uma aproximação do layout real, não um espelho pixel-perfect — suficiente para "não parecer quebrado", que é o objetivo do achado #2.
- Ganha-se um único ponto de manutenção e reuso imediato para qualquer rota nova que o app ganhar depois.

---

### Decision 2: Linha expansível (não tooltip on-hover) para a camada de linguagem simples

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-08-09 |

**Context:** A DEFINE (Open Question #1) deixou em aberto se a descrição leiga por parâmetro (#4) deveria aparecer via tooltip on-hover, linha expansível, ou ambos. A persona primária (fazendeiro) é majoritariamente mobile, conforme `Target Users` na DEFINE.

**Choice:** Linha expansível — toque no nome do parâmetro (ou no ícone de informação ao lado) expande uma linha abaixo com o texto de `parameters.description`, sem navegação para outra tela.

**Rationale:** Tooltips dependem de estado `:hover`, que não existe em telas de toque — o fazendeiro em campo, no celular, nunca veria o conteúdo. `ui-ux/patterns/interaction-states.md` reforça que estados de interação devem comunicar status de forma acessível independente do dispositivo de entrada. Uma linha expansível funciona identicamente em mouse e toque, sem duplicar lógica por breakpoint.

**Alternatives Rejected:**
1. Tooltip on-hover puro — rejeitado por não funcionar em touch, que é o contexto de uso dominante da persona.
2. Tooltip + fallback de toque (dois comportamentos) — rejeitado por dobrar a superfície de teste e manutenção para um ganho marginal sobre a linha expansível sozinha.

**Consequences:**
- Desktop perde a conveniência do hover instantâneo, mas ganha consistência de comportamento com mobile.
- A tabela de resultados (`analysis-results-table.tsx`) já é uma tabela client-agnostic (Server Component); a expansão em si precisa de um pequeno ilha client-side (`'use client'` no componente de linha ou um wrapper), pois requer estado local de aberto/fechado.

---

### Decision 3: Reaproveitar `parameters.description` com rótulo condicional, sem nova coluna

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-08-09 |

**Context:** O P0 já usa `parameters.description` para o callout "O que fazer" exibido apenas em linhas com `is_alert = true`, com texto redigido como ação corretiva (ex.: "Amônia acima do limite é tóxica... reduza o arraçoamento"). O item #4 quer essa mesma informação disponível também para linhas normais, como explicação do parâmetro. A Assumption A-004 da DEFINE já assume reaproveitar o campo único.

**Choice:** Manter um único campo (`parameters.description`), mas trocar o rótulo de exibição condicionalmente: `"O que fazer:"` quando `is_alert = true` (comportamento do P0, inalterado), `"Sobre este parâmetro:"` quando não há alerta. Uma nova migration (`20260809000002`) estende o conteúdo aos 16 parâmetros que o P0 não cobriu (os que não têm `ref_min`/`ref_max` e por isso nunca disparam alerta).

**Rationale:** Respeita a Constraint técnica da DEFINE (nenhuma migration de schema) e a Assumption A-004. O rótulo condicional é suficiente para o texto fazer sentido nos dois contextos sem reescrever o conteúdo já publicado dos 9 parâmetros do P0.

**Alternatives Rejected:**
1. Nova coluna `layperson_description` separada de `description` — rejeitado por violar a Constraint da DEFINE ("sem nova coluna") e por duplicar esforço de redação para os 9 parâmetros que já têm texto adequado.
2. Reescrever o texto dos 9 parâmetros do P0 para um tom neutro, perdendo a orientação acionável do callout de alerta — rejeitado porque regride um achado P0 já validado em produção.

**Consequences:**
- Para os 9 parâmetros com alerta configurado, o texto sob "Sobre este parâmetro" quando normal soa um pouco como aviso antecipado (ex.: menciona "aplique calcário" mesmo quando o valor está ok) — aceito como imperfeição menor de tom, não de informação incorreta.
- Os 16 parâmetros restantes ganham texto genuinamente neutro/explicativo, redigido nesta rodada.

---

### Decision 4: Menu mobile em coluna flex única, sem medir a altura do header via JavaScript

| Attribute | Value |
|-----------|-------|
| **Status** | Accepted |
| **Date** | 2026-08-09 |

**Context:** `mobile-nav.tsx` hoje usa `style={{ top: '52px' }}` fixo para posicionar o painel do menu abaixo do header, quebrando quando o nome do cliente/empresa faz o header quebrar linha (achado #5, `mobile-nav.tsx:55`... hoje linha 67 após o P0).

**Choice:** Remover o header do fluxo `fixed` e colocá-lo, junto com o painel do menu, dentro de um único container `relative flex flex-col` em fluxo normal de documento. O backdrop semi-transparente continua `fixed inset-0`, mas atrás (z-index menor) do header+painel.

**Rationale:** Em fluxo normal, o painel sempre começa exatamente onde o header termina, seja qual for a altura real renderizada — nenhum número mágico, nenhuma medição em runtime. É a abordagem mais simples que resolve a causa raiz (o offset era uma suposição de altura fixa), não um sintoma.

**Alternatives Rejected:**
1. Medir a altura do header com `ResizeObserver`/`useLayoutEffect` e aplicar como `top` dinâmico — rejeitado por adicionar complexidade (efeito colateral, possível flash de posicionamento incorreto no primeiro render) para resolver algo que CSS de fluxo normal já resolve sem JavaScript.
2. `position: sticky` no header com painel logo abaixo em fluxo normal, mas mantendo o backdrop restrito à área abaixo do header — rejeitado por ser equivalente em resultado à escolha final, porém mais complexo de implementar corretamente com Tailwind puro.

**Consequences:**
- O backdrop agora cobre visualmente toda a viewport (incluindo atrás do header, que fica por cima via z-index) — mudança cosmética irrelevante, padrão comum em menus mobile.
- Zero JavaScript adicional; a correção é inteiramente CSS/estrutural.

---

## File Manifest

| # | File | Action | Purpose | Agent | Dependencies |
|---|------|--------|---------|-------|--------------|
| 1 | `src/components/shared/page-skeleton.tsx` | Create | Componente compartilhado de skeleton com variantes `grid`/`table`/`detail`/`form` (#2) | @agentspec:design:ui-specialist | None |
| 2 | `src/app/portal/dashboard/loading.tsx` | Create | Skeleton variante `grid` (#2) | @agentspec:design:ui-specialist | 1 |
| 3 | `src/app/portal/farms/loading.tsx` | Create | Skeleton variante `grid` (#2) | @agentspec:design:ui-specialist | 1 |
| 4 | `src/app/portal/farms/[id]/loading.tsx` | Create | Skeleton variante `grid` (#2) | @agentspec:design:ui-specialist | 1 |
| 5 | `src/app/portal/analyses/[id]/loading.tsx` | Create | Skeleton variante `detail` (#2) | @agentspec:design:ui-specialist | 1 |
| 6 | `src/app/portal/compare/loading.tsx` | Create | Skeleton variante `form` (#2) | @agentspec:design:ui-specialist | 1 |
| 7 | `src/app/admin/dashboard/loading.tsx` | Create | Skeleton variante `grid` (#2) | @agentspec:design:ui-specialist | 1 |
| 8 | `src/app/admin/clients/loading.tsx` | Create | Skeleton variante `table` (#2) | @agentspec:design:ui-specialist | 1 |
| 9 | `src/app/admin/clients/new/loading.tsx` | Create | Skeleton variante `form` (#2) | @agentspec:design:ui-specialist | 1 |
| 10 | `src/app/admin/clients/[id]/loading.tsx` | Create | Skeleton variante `detail` (#2) | @agentspec:design:ui-specialist | 1 |
| 11 | `src/app/admin/clients/[id]/edit/loading.tsx` | Create | Skeleton variante `form` (#2) | @agentspec:design:ui-specialist | 1 |
| 12 | `src/app/admin/parameters/loading.tsx` | Create | Skeleton variante `table` (#2) | @agentspec:design:ui-specialist | 1 |
| 13 | `src/app/admin/farms/[id]/loading.tsx` | Create | Skeleton variante `detail` (#2) | @agentspec:design:ui-specialist | 1 |
| 14 | `src/app/admin/ponds/[id]/loading.tsx` | Create | Skeleton variante `detail` (#2) | @agentspec:design:ui-specialist | 1 |
| 15 | `src/app/admin/analyses/new/loading.tsx` | Create | Skeleton variante `form` (#2) | @agentspec:design:ui-specialist | 1 |
| 16 | `src/app/admin/analyses/[id]/loading.tsx` | Create | Skeleton variante `detail` (#2) | @agentspec:design:ui-specialist | 1 |
| 17 | `src/app/admin/analyses/[id]/edit/loading.tsx` | Create | Skeleton variante `form` (#2) | @agentspec:design:ui-specialist | 1 |
| 18 | `src/app/admin/settings/loading.tsx` | Create | Skeleton variante `form` (#2) | @agentspec:design:ui-specialist | 1 |
| 19 | `src/app/portal/ponds/[id]/page.tsx` | Modify | Troca "Carregando..." por `PageSkeleton variant="detail"` (#2); adiciona query de parâmetro mais recente em alerta como seleção padrão do gráfico (#6) | @agentspec:cloud:supabase-specialist | 1 |
| 20 | `src/components/charts/parameter-chart.tsx` | Modify | `YAxis` com largura/fonte responsivas abaixo de 400px (#7) | @agentspec:design:ui-specialist | None |
| 21 | `src/components/analyses/analysis-form.tsx` | Modify | Validação client-side em tempo real contra `ref_min`/`ref_max` na etapa 2 (#3) | @agentspec:design:ux-specialist | None |
| 22 | `src/components/analyses/analysis-results-table.tsx` | Modify | Linha de parâmetro expansível exibindo `parameters.description` com rótulo condicional (#4) | @agentspec:design:ux-specialist | 23 |
| 23 | `supabase/migrations/20260809000002_parameter_descriptions_full.sql` | Create | Estende `description` aos 16 parâmetros sem texto (#4) | @agentspec:cloud:supabase-specialist | None |
| 24 | `src/components/layout/mobile-nav.tsx` | Modify | Reestrutura header+painel em coluna flex única, remove `top: '52px'` (#5) | @agentspec:design:ui-specialist | None |
| 25 | `tailwind.config.ts` | Modify | Adiciona escala tipográfica nomeada `fontSize.stat` (#8) | @agentspec:design:ui-specialist | None |
| 26 | `src/app/admin/dashboard/page.tsx` | Modify | Aplica `text-stat` aos 3 números de destaque em vez de `text-3xl` ad hoc (#8) | @agentspec:design:ui-specialist | 25 |
| 27 | `src/app/portal/dashboard/page.tsx` | Modify | Estado vazio ganha frase de expectativa sobre cadência de análises (#9) | @agentspec:design:ux-specialist | None |
| 28 | `src/app/portal/farms/[id]/page.tsx` | Modify | Estado vazio ("nenhum viveiro") e cards "sem análises" ganham frase de expectativa (#9) | @agentspec:design:ux-specialist | None |
| 29 | `src/app/admin/clients/page.tsx` | Modify | Badge "Ativo/Inativo/Pendente" migrado de classes Tailwind genéricas para `Badge` com variantes `success`/`warning`/`outline` (#1) | @agentspec:design:ui-specialist | None |
| 30 | `src/app/admin/parameters/page.tsx` | Modify | Badge "Ativo/Inativo" migrado para `Badge` (#1) | @agentspec:design:ui-specialist | None |
| 31 | `src/app/admin/clients/[id]/page.tsx` | Modify | Badge "Acesso ao portal" migrado para `Badge` (#1) | @agentspec:design:ui-specialist | None |

**Total Files:** 31 (9 Create, 22 Modify)

---

## Agent Assignment Rationale

> Agentes descobertos em `${CLAUDE_PLUGIN_ROOT}/agents/design/` e `${CLAUDE_PLUGIN_ROOT}/agents/cloud/`.

| Agent | Files Assigned | Why This Agent |
|-------|----------------|-----------------|
| @agentspec:design:ui-specialist | 1-18, 20, 24-26, 29-31 | Implementação de componente, layout responsivo, design tokens e acessibilidade — corresponde exatamente ao domínio KB `ui-ux` já vinculado na DEFINE |
| @agentspec:design:ux-specialist | 21, 22, 27, 28 | Feedback de interação, redação de estados vazios e a decisão de exibição (linha expansível vs. tooltip) são de fluxo/usabilidade, não de estilo visual |
| @agentspec:cloud:supabase-specialist | 19, 23 | Query adicional sobre dados relacionais (parâmetro mais recente em alerta) e migration de dados — ambos exigem conhecimento de RLS/Postgres, não apenas de React |

**Agent Discovery:**
- Escaneado: `${CLAUDE_PLUGIN_ROOT}/agents/design/*.md`, `${CLAUDE_PLUGIN_ROOT}/agents/cloud/*.md`
- Casado por: tipo de arquivo, palavras-chave do propósito (skeleton/responsivo → ui-specialist; feedback/copy → ux-specialist; query/migration → supabase-specialist), domínio KB da DEFINE (`ui-ux`, `supabase`)
- Nenhum arquivo caiu em `(general)` — os 3 agentes especializados cobrem 100% do manifesto

---

## Code Patterns

### Pattern 1: `PageSkeleton` compartilhado (KB: `ui-ux/patterns/interaction-states.md`)

```tsx
// src/components/shared/page-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'

type PageSkeletonVariant = 'grid' | 'table' | 'detail' | 'form'

export function PageSkeleton({ variant }: { variant: PageSkeletonVariant }) {
  if (variant === 'grid') {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }
  if (variant === 'table') {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 border-b border-gray-100 last:border-0" />
          ))}
        </div>
      </div>
    )
  }
  if (variant === 'detail') {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 rounded-xl mb-4" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }
  // form
  return (
    <div className="max-w-2xl">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>
    </div>
  )
}
```

```tsx
// src/app/portal/dashboard/loading.tsx — repetir este molde nos outros 16 arquivos, trocando a variant
import { PageSkeleton } from '@/components/shared/page-skeleton'

export default function Loading() {
  return <PageSkeleton variant="grid" />
}
```

### Pattern 2: Parâmetro padrão do gráfico = mais recente em alerta (KB: `supabase/patterns`)

```tsx
// src/app/portal/ponds/[id]/page.tsx — dentro do useEffect de carregamento inicial
if (analysesData?.length) {
  const { data: params_ } = await supabase
    .from('parameters')
    .select('*')
    .eq('active', true)
    .order('display_order')
  setParameters(params_ ?? [])

  // analysesData já vem ordenado por collected_at desc (query existente) —
  // [0] é a análise mais recente do viveiro.
  const mostRecentAnalysisId = analysesData[0].id

  const { data: alerted } = await supabase
    .from('analysis_results')
    .select('parameter_id, parameters!inner(display_order)')
    .eq('analysis_id', mostRecentAnalysisId)
    .eq('is_alert', true)
    .order('display_order', { foreignTable: 'parameters', ascending: true })
    .limit(1)

  const defaultParamId = alerted?.[0]?.parameter_id ?? params_?.[0]?.id
  if (defaultParamId) setSelectedParamId(defaultParamId)
}
```

> Nota: `.order(coluna, { foreignTable: '...' })` já é o padrão usado neste mesmo arquivo (linha do `last_analysis` em `portal/dashboard/page.tsx`) e em `portal/ponds/[id]/page.tsx` para ordenar por tabela relacionada — este pattern segue a convenção existente, não introduz uma nova.

### Pattern 3: Validação em tempo real no formulário (KB: `ui-ux/patterns/interaction-states.md` — Error state)

```tsx
// src/components/analyses/analysis-form.tsx — dentro do map de parâmetros da etapa 2
function isOutOfRange(param: Parameter, rawValue: string): boolean {
  const value = parseFloat(rawValue)
  if (rawValue === '' || isNaN(value)) return false
  const belowMin = param.ref_min !== null && value < param.ref_min
  const aboveMax = param.ref_max !== null && value > param.ref_max
  return belowMin || aboveMax
}

// No input:
<input
  type="text"
  inputMode="decimal"
  value={values[p.id] ?? ''}
  onChange={(e) => handleValueChange(p.id, e.target.value)}
  className={cn(
    'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 font-mono',
    isOutOfRange(p, values[p.id] ?? '')
      ? 'border-red-400 bg-red-50 focus:ring-red-400'
      : 'border-gray-300 focus:ring-ocean-500'
  )}
  placeholder={p.ref_min !== null || p.ref_max !== null ? `ref: ${p.ref_min ?? '—'} – ${p.ref_max ?? '—'}` : ''}
/>
{isOutOfRange(p, values[p.id] ?? '') && (
  <p className="text-xs text-red-600 mt-1">Fora da faixa de referência</p>
)}
```

> Reaproveita a mesma regra de comparação de `src/lib/alerts/checker.ts` (`isBelow`/`isAbove`), sem chamar a API — é apenas feedback visual antecipado; a validação de servidor em `POST/PATCH /api/analyses` continua sendo a fonte de verdade para `is_alert`.

### Pattern 4: Linha expansível com rótulo condicional (Decision 2 + Decision 3)

```tsx
// src/components/analyses/analysis-results-table.tsx — substitui a célula de nome do parâmetro
'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

function ParameterNameCell({ row }: { row: ResultRow }) {
  const [open, setOpen] = useState(false)
  const description = row.parameters.description
  if (!description) return <span>{row.parameters.name}</span>

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-left"
        aria-expanded={open}
      >
        {row.parameters.name}
        <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          <span className="font-medium">{row.is_alert ? 'O que fazer: ' : 'Sobre este parâmetro: '}</span>
          {description}
        </p>
      )}
    </div>
  )
}
```

> Nota de implementação: como `analysis-results-table.tsx` hoje é Server Component, este pedaço interativo precisa ser isolado em seu próprio módulo `'use client'` (`ParameterNameCell`) importado pela tabela — o restante da tabela permanece Server Component.

### Pattern 5: Eixo Y responsivo do gráfico (#7)

```tsx
// src/components/charts/parameter-chart.tsx
'use client'
import { useEffect, useState } from 'react'

function useIsNarrowViewport(breakpointPx = 400) {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`)
    setNarrow(mq.matches)
    const handler = (e: MediaQueryListEvent) => setNarrow(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpointPx])
  return narrow
}

// Dentro de ParameterChart:
const narrow = useIsNarrowViewport()
// ...
<YAxis tick={{ fontSize: narrow ? 10 : 11 }} width={narrow ? 32 : 50} />
```

### Pattern 6: Escala tipográfica para stat cards (#8)

```ts
// tailwind.config.ts — dentro de theme.extend
fontSize: {
  stat: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }], // equivalente a text-3xl font-bold, agora nomeado
},
```

```tsx
// src/app/admin/dashboard/page.tsx
<p className="text-stat text-ocean-700 mt-1">{clientCount ?? 0}</p>
```

### Pattern 7: Badge de status migrado (#1)

```tsx
// Antes (admin/clients/page.tsx, admin/parameters/page.tsx, admin/clients/[id]/page.tsx):
<span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
  {p.active ? 'Ativo' : 'Inativo'}
</span>

// Depois:
import { Badge } from '@/components/ui/badge'
<Badge variant={p.active ? 'success' : 'outline'}>{p.active ? 'Ativo' : 'Inativo'}</Badge>
```

---

## Data Flow

```text
1. Fazendeiro/técnico navega para uma rota Server Component
   │
   ▼
2. App Router mostra loading.tsx (<PageSkeleton/>) imediatamente — Suspense boundary nativo
   │
   ▼
3. Server Component busca dados no Supabase (RLS já filtra por role/client_id, inalterado do P0)
   │
   ▼
4. Conteúdo real substitui o skeleton quando a promise resolve
   │
   ▼
5. [Somente em portal/ponds/[id]] Client Component roda 2ª query para achar o
   parâmetro em alerta mais recente e pré-seleciona no gráfico
   │
   ▼
6. Interações locais (linha expansível, validação em tempo real do form,
   menu mobile) não disparam novas queries — operam sobre dados já em memória
```

---

## Integration Points

| External System | Integration Type | Authentication |
|-----------------|-------------------|-----------------|
| Supabase Postgres (mesma instância do P0) | Client SDK (`@supabase/ssr`) — 1 query adicional em `portal/ponds/[id]/page.tsx` | RLS via sessão do usuário logado (herda policies `results_client_select`/`results_lab_admin_all` já existentes, nenhuma policy nova necessária) |

Nenhum novo sistema externo. Nenhuma nova variável de ambiente.

---

## Testing Strategy

| Test Type | Scope | Files | Tools | Coverage Goal |
|-----------|-------|-------|-------|-----------------|
| Unit (opcional, recomendado) | `isOutOfRange()` (Pattern 3) e a lógica de seleção de parâmetro em alerta (Pattern 2, extraída como função pura testável) | Novo `src/lib/alerts/checker.test.ts` (estender o já existente) | Jest | Ambas as funções puras, casos de borda (sem `ref_min`/`ref_max`, valor vazio) |
| Manual — AT-001, AT-002 | `/portal/ponds/[id]` com e sem alerta na análise mais recente | — | Navegador, dados de teste no Supabase | 2 cenários (com/sem alerta) |
| Manual — AT-003 | Todas as 17 rotas com `loading.tsx`, simulando rede lenta (DevTools → Network → Slow 3G) | — | Chrome DevTools | 17/17 rotas confirmadas |
| Manual — AT-004 | Etapa 2 do formulário de análise, campo com `ref_max` definido | — | Navegador | 1 caminho feliz + 1 valor dentro da faixa (não deve sinalizar) |
| Manual — AT-005 | Tabela de resultados, parâmetro com e sem `description` preenchida | — | Navegador (desktop + mobile real ou emulado) | Confirma toque funciona igual a clique |
| Manual — AT-006 | Menu mobile com `company_name` longo o suficiente para quebrar linha | — | Navegador mobile emulado, viewport estreita | 1 cenário |
| Manual — regressão | 6 páginas tocadas pelo P0 (checklist já definido na DEFINE) | — | Navegador | 0 regressões |

> Nota (herdada da DEFINE, Assumption A-005): testes automatizados de UI (E2E/visual) seguem fora de escopo. A suíte Jest do projeto está com um gap de ambiente pré-existente (`ts-node` ausente, não relacionado a esta feature) — recomendado resolver antes de expandir a cobertura unitária, mas não é bloqueante para este ciclo.

---

## Error Handling

| Error Type | Handling Strategy | Retry? |
|------------|---------------------|--------|
| Query de "parâmetro em alerta" falha ou retorna vazio (#6) | `defaultParamId` cai para `params_?.[0]?.id` — mesmo comportamento de hoje, sem erro visível ao usuário | Não — degrada graciosamente para o comportamento atual |
| Migration `20260809000002` falha parcialmente (ex.: nome de parâmetro não bate) | Cada `UPDATE ... WHERE name = '...'` é independente e idempotente — rodar de novo não duplica nem corrompe dados | Sim — seguro re-executar a migration inteira |
| `parameters.description` nulo em uma linha (parâmetro esquecido na migration) | `ParameterNameCell` (Pattern 4) já trata: sem `description`, renderiza só o nome, sem botão de expandir | Não aplicável |
| Falso positivo na validação em tempo real (ex.: usuário ainda digitando "-" ou vazio) | `isOutOfRange` retorna `false` para string vazia ou `NaN` — não sinaliza campo enquanto o número está incompleto | Não aplicável |

---

## Configuration

| Config Key | Type | Default | Description |
|------------|------|---------|--------------|
| Breakpoint do gráfico responsivo (Pattern 5) | number (px, hardcoded no componente) | `400` | Abaixo desta largura de viewport, `YAxis` usa fonte/largura reduzidas |
| `fontSize.stat` (tailwind.config.ts) | Tailwind token | `1.875rem` / `700` | Escala tipográfica nomeada para números de destaque em stat cards |

Nenhuma variável de ambiente nova. Nenhum config runtime além dos tokens Tailwind já existentes.

---

## Security Considerations

- `parameters.description` já é conteúdo autoral do `lab_admin` (mesma trust boundary do P0) exibido a clientes via JSX — React escapa automaticamente, sem `dangerouslySetInnerHTML` em nenhum dos patterns acima, então não há superfície de XSS nova.
- A nova query de `analysis_results` (Pattern 2) herda as RLS policies já existentes (`results_client_select`, `results_lab_admin_all`) — nenhuma policy nova, nenhum bypass de autorização introduzido.
- Nenhum dado sensível novo é exposto: a query de #6 lê exatamente o mesmo `analysis_results` que a tabela já renderiza, apenas com um filtro adicional.

---

## Observability

| Aspect | Implementation |
|--------|-----------------|
| Logging | Inalterado do P0 — sem infraestrutura formal de logging (MVP sem orçamento, ver Constraint de Recurso na DEFINE). Erros de query seguem o padrão existente (`console.error` + degradação graciosa) |
| Metrics | N/A para este ciclo — checklist manual de regressão (Testing Strategy) é o mecanismo de verificação |
| Tracing | N/A |

---

## Pipeline Architecture (if applicable)

N/A — confirmado na DEFINE (`Data Contract`). Nenhuma mudança de schema, pipeline ou ETL; a única migration desta feature (#23 no manifesto) é `UPDATE` de dados sobre uma coluna já existente, seguindo exatamente o padrão já usado pela migration do P0.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|-----------|
| 1.0 | 2026-08-09 | design-agent | Versão inicial — arquitetura e especificação técnica para os 9 achados P1+P2 |

---

## Next Step

**Ready for:** `/ship .claude/sdd/features/DEFINE_UIUX_AUDIT_P1_P2.md`
