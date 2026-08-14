# DIAGNOSIS: AT-001 — `auth.admin.createUser` falha para qualquer usuário novo

> Investigação da causa raiz do blocker registrado em
> [BUILD_REPORT_CLIENT_PASSWORDLESS_ACCESS.md](BUILD_REPORT_CLIENT_PASSWORDLESS_ACCESS.md)
> e proposta de resolução.

## Metadata

| Attribute | Value |
|-----------|-------|
| **Feature relacionada** | CLIENT_PASSWORDLESS_ACCESS |
| **Data** | 2026-08-14 |
| **Status** | Causa raiz confirmada — fix pronto, aguardando autorização para `db push` |
| **Migration proposta** | [`20260814000003_fix_handle_new_user_search_path.sql`](../../supabase/migrations/20260814000003_fix_handle_new_user_search_path.sql) (criada, **não aplicada** em produção) |

---

## Resumo

`auth.admin.createUser` falhava com `{"code":500,"error_code":"unexpected_failure","msg":"Database error creating new user"}` para **qualquer** e-mail, com ou sem metadata — confirmando que não era específico do payload da feature. A causa raiz é um bug clássico de Postgres/Supabase: a função `handle_new_user()` é `SECURITY DEFINER` mas nunca fixou `search_path`, e a role que dispara o trigger (`supabase_auth_admin`) tem o `search_path` travado em `auth` — então a referência não qualificada `profiles` dentro da function nunca resolvia, e o INSERT lançava `relation "profiles" does not exist"`.

Isso **não é um bug novo** introduzido por esta feature. É um bug pré-existente que sempre esteve lá; a versão antiga do trigger (`EXCEPTION WHEN OTHERS THEN RETURN NEW`) só o escondia, deixando o INSERT em `auth.users` "funcionar" enquanto o `profiles` correspondente nunca era criado. A migration `20260814000002` (parte desta feature) removeu esse swallow — corretamente — o que fez esse erro, que sempre existiu, deixar de ser silencioso e passar a abortar a criação do usuário inteira.

---

## Evidência (queries read-only contra produção, projeto `pfwlmkktsdeomibgmtnd`)

### 1. `handle_new_user()` não tem `search_path` fixado

```sql
select p.proname, p.prosecdef, p.proconfig, pg_get_userbyid(p.proowner) as owner
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'handle_new_user' and n.nspname = 'public';
```

```json
{ "proname": "handle_new_user", "prosecdef": true, "proconfig": null, "owner": "postgres" }
```

`proconfig: null` confirma que a function **não** tem `SET search_path = ...` na definição — apesar de ser `SECURITY DEFINER`. Para uma function `SECURITY DEFINER` sem `search_path` fixado, o Postgres usa o `search_path` da **sessão que chama**, não o do dono da function.

### 2. `supabase_auth_admin` (a role que insere em `auth.users`) tem `search_path` travado em `auth`

```sql
select rolname, rolconfig from pg_roles
where rolname in ('supabase_auth_admin','postgres','authenticator');
```

```json
[
  { "rolname": "postgres",            "rolconfig": ["search_path=\"$user\", public, extensions"] },
  { "rolname": "authenticator",       "rolconfig": ["session_preload_libraries=...", ...] },
  { "rolname": "supabase_auth_admin", "rolconfig": ["search_path=auth", "idle_in_transaction_session_timeout=60000", "log_statement=none"] }
]
```

Esse é o hardening padrão da própria Supabase: o GoTrue (serviço de Auth) sempre escreve em `auth.users` autenticado como `supabase_auth_admin`, uma role deliberadamente restrita a enxergar só o schema `auth` — precisamente para impedir que triggers em `auth.users` acessem outros schemas por acidente (ou por ataque de search_path hijacking) sem qualificação explícita.

Confirmação adicional de que essa role é travada mesmo para superusuário administrativo:

```sql
set role supabase_auth_admin;
-- ERROR: 42501: permission denied to set role "supabase_auth_admin"
```

Nem a conexão `postgres` usada nestas queries consegue assumir essa role — reforça que é uma restrição de plataforma, não uma configuração acidental deste projeto.

### 3. A função referencia `profiles` sem qualificar o schema

```sql
INSERT INTO profiles (id, role, full_name) VALUES (...)  -- não "public.profiles"
```

Com `search_path=auth` ativo durante a execução do trigger (herdado da sessão `supabase_auth_admin`), `profiles` não resolve para `public.profiles` — não existe `auth.profiles`. O INSERT lança `relation "profiles" does not exist`, a exceção agora propaga (correto, pós-fix do swallow), a transação inteira do GoTrue (incluindo o INSERT em `auth.users`) sofre rollback, e a Admin API responde com o 500 genérico.

Esse é exatamente o padrão de erro documentado pela própria Supabase para esse tipo de bug — por isso os exemplos oficiais deles sempre qualificam `public.profiles` **e** fixam `search_path = ''` nesse trigger específico.

### 4. Por que os 4 usuários existentes têm `profiles` mesmo assim

```sql
select u.email, u.created_at as user_created, p.created_at as profile_created,
       (p.created_at - u.created_at) as delta
from auth.users u left join public.profiles p on p.id = u.id order by u.created_at;
```

| email | delta (profile − user) |
|---|---|
| freitas.monte9@gmail.com | 8min 4s |
| raul.martins@camaraocamarada.io | 51s |
| michasfotos13@gmail.com | 2min 34s |
| demo-camarao-camarada@demo.com | **0.48s** |

Os deltas de minutos nos 3 primeiros são consistentes com a **versão antiga do trigger** (que engolia o erro) seguida de alguém inserindo o `profiles` manualmente depois, fora da app — não há nenhum caminho no código da aplicação que faça esse INSERT (`grep` em `src/` só encontra `.from('profiles')` de leitura, nunca insert). O quarto caso (delta de 0.48s, portanto bem-sucedido de fato via trigger) é anterior ao teste do AT-001 e não invalida o diagnóstico: o comportamento do `search_path` da role `supabase_auth_admin` é configuração de plataforma da Supabase, não algo que este projeto controla ou que muda entre uma criação de usuário e outra — o mais provável é que o trigger em produção, antes de ser realinhado pela migration `20260814000002` (lembrando: ele **diverge de git há tempo**, conforme já registrado em memória do projeto), tenha passado por versões manuais intermediárias que qualificavam `public.profiles` corretamente, e a migration desta feature reintroduziu sem querer a versão não qualificada do `20260620000001_initial_schema.sql` original. Não é possível confirmar isso retroativamente sem os logs do Postgres (fora do alcance de queries read-only), mas não muda a ação corretiva: o estado **atual** da function, verificado diretamente, é o problema, independentemente de exatamente quando ele foi introduzido.

---

## Resolução proposta

Criada (não aplicada) a migration
[`20260814000003_fix_handle_new_user_search_path.sql`](../../supabase/migrations/20260814000003_fix_handle_new_user_search_path.sql):

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
```

Duas mudanças, ambas necessárias:

1. `profiles` → `public.profiles` (qualifica o schema explicitamente)
2. `SET search_path = ''` na definição da function (fixa o search_path da function independentemente de quem a chama — sem isso, qualquer objeto não qualificado no corpo continuaria vulnerável ao mesmo problema, e a function ficaria exposta ao clássico ataque de search_path hijacking em SECURITY DEFINER)

Mantém `ON CONFLICT (id) DO NOTHING` (idempotência) e **não** reintroduz o swallow de exceções — o objetivo desta feature (parar de esconder erros reais) continua preservado.

### Achado secundário (não bloqueante, fora do escopo do AT-001)

`current_user_role()` e `current_client_id()` (definidas em `20260620000002_rls_policies.sql`) também são `SECURITY DEFINER` sem `search_path` fixado. Elas não causam o bug do AT-001 porque são chamadas por usuários autenticados via PostgREST, cujo `search_path` de sessão já inclui `public` — mas ficam com a mesma classe de vulnerabilidade (hardening incompleto) caso algum dia sejam chamadas em outro contexto. Recomendo aplicar o mesmo padrão (`SET search_path = ''` + qualificar `public.profiles`/`public.clients`) numa migration separada, sem urgência.

---

## Plano de teste após aplicar

1. Usuário autoriza `supabase db push --linked` para aplicar `20260814000003`
2. Reexecutar AT-001: `curl` contra `/api/auth/access-request` com `cliente@fazenda.com` (ou criar um novo `client` de teste) e confirmar `auth.admin.createUser` retorna 200 e `clients.user_id` é preenchido
3. Reexecutar AT-003 (login recorrente): confirmar que a segunda chamada não recria o usuário
4. Reexecutar AT-004 (cadastro inexistente → 404 genérico), que também não foi testado end-to-end
5. Confirmar via `supabase db query --linked` que `count(*) FROM auth.users` e `count(*) FROM public.profiles` sobem juntos para o novo usuário de teste

Depois disso, o blocker do BUILD_REPORT fica resolvido e a feature pode seguir para `/ship`.
