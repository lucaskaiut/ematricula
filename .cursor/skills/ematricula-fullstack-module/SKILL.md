---
name: ematricula-fullstack-module
description: Orienta criação de módulos full-stack no eMatrícula alinhados ao módulo Person (professores/alunos). Cobre Laravel (models, services, controllers, Form Requests, Resources, rotas, filtros), Next.js (rotas App Router, Route Handlers BFF, server actions, formulários React Hook Form + Zod, lista com URL state e TanStack Query). Use ao implementar CRUD novo, espelhar um recurso da API no web, ou quando o usuário pedir um módulo completo.
---

# Módulo full-stack eMatrícula

Stack de referência: **Laravel 13**, **Next.js 16**, **Tailwind CSS 4**, **React 19**.

O módulo de referência mais completo é **Person** (`api/app/Modules/Person/`), usado nas UIs de **alunos** e **professores** (`web/app/(private)/alunos`, `web/app/(private)/professores` + pasta compartilhada `web/app/(private)/_persons/`).

## Antes de implementar: perguntar ao usuário

Não inventar regras de negócio. Se algo não estiver explícito, perguntar de forma objetiva (ex.: "O campo X é obrigatório?", "Há unicidade por empresa?", "Lista precisa de quais filtros e ordenação?").

Checklist mínimo:

- Nome do recurso (singular/plural), prefixo da rota API e paths no Next (ex.: `/modalities`, `/professores`).
- Campos do modelo: tipos, obrigatoriedade, defaults, unicidade (especialmente **por `company_id`**).
- Relacionamentos (BelongsTo, BelongsToMany, etc.) e se há **pivot** ou sync no `create`/`update`.
- Enums string persistidos: valores permitidos e rótulos na UI.
- Filtros da listagem: igualdade, `like`, intervalos `between` (datas), filtros `whereHas` (ex.: `modality_ids` → `relationshipAllOfFilters` no service).
- Ordenação: colunas permitidas (`allowedOrderBy`).
- Permissões futuras (se aplicável); por ora muitos controllers usam `authorize(): true` no Form Request.

Só prosseguir quando requisitos críticos (campos obrigatórios, regras condicionais, relacionamentos) estiverem claros ou explicitamente assumidos pelo usuário.

## Backend (Laravel) — layout do módulo

Namespace e pastas:

```text
api/app/Modules/{Nome}/
  Domain/
    Models/
    Enums/          # opcional; backed enum string
    Services/
  Http/
    Controllers/
    Requests/
    Resources/
```

### Model (`Domain/Models`)

- `declare(strict_types=1);`
- Atributos Eloquent: `#[Table('nome_tabela')]`, `#[ObservedBy([UserAuditObserver::class])]`, `#[TracksUserAudit]` quando o recurso tiver auditoria como `Person`.
- `use HasCompany` para dados multi-tenant; preenche `company_id` e aplica `CompanyScope`.
- `$fillable` alinhado ao que a API aceita; `casts()` com datas e enums.
- Mutators via `Attribute::make` para normalização (trim, lowercase, só dígitos) quando fizer sentido, como em `Person`.
- Relacionamentos nomeados de forma consistente com o Resource (`whenLoaded`).

### Service (`Domain/Services/{Nome}Service.php`)

- `implements ServiceContract` e `use ServiceTrait`.
- `protected string $model = {Model}::class;`
- Sobrescrever `allowedOrderBy(): array` com a allowlist de ordenação (vazia = qualquer coluna passa no trait — evitar isso em recursos expostos).
- Sobrescrever `relationshipAllOfFilters(): array` quando filtros da query mapearem para `whereHas` repetido (mapa `chave_filtro => ['relacao', 'relacao.coluna']`), como `modality_ids` em `PersonService`.
- Sobrescrever `create`/`update`/`paginate` quando houver lógica extra (sync de pivot, filtros especiais como `eligible_as_guardian`).

### Controller (`Http/Controllers`)

- `use ControllerTrait` e definir `$service`, `$resource`, `$request` (FQCNs).
- `store`, `update`, `destroy` vêm do trait; usam transação e o Form Request para `validated()`.
- Para `index`/`show`, copiar o padrão de `PersonController` ou `ModalityController`: ler `filters`, `orderBy`, `per_page`; chamar `paginate` ou `findOrFail` com o array de `relations` necessário para o Resource.

### Form Request (`Http/Requests`)

- `prepareForValidation()` para normalizar entrada (igual ou compatível com o model).
- `rules()` com `Rule::enum`, `Rule::unique(...)->where(company_id)->ignore($id)`, `exists` com escopo de empresa quando couber.
- Regras condicionais: `Rule::excludeIf`, `Rule::requiredIf`, e `withValidator` + `$validator->after()` para invariantes entre campos (ex.: responsável não pode ser menor, não pode ser o próprio registro).

### Resource (`Http/Resources`)

- JSON estável para o frontend: tipos escalares, datas em `Y-m-d` quando for date-only, enums como `->value`, relações com `whenLoaded`.
- Resource resumido (ex.: `PersonSummaryResource`) quando aninhar listas leves.

### Rotas (`api/routes/api.php`)

- Dentro de `Route::middleware(['auth:sanctum', InitializeCompany::class])`, grupo com `prefix` REST: `GET /`, `GET /{id}`, `POST /`, `PUT|PATCH /{id}`, `DELETE /{id}`.

### Migração

- Tabela com `company_id` → `constrained('companies')` quando usar `HasCompany`.
- Índices únicos compostos com `company_id` quando a regra for por tenant (email, CPF, etc.).

## Frontend (Next.js) — espelho do recurso

### Tipos (`web/types/api.ts`)

- Tipos para atributos da API alinhados ao Resource (incluir `creator`/`updater` se carregados).

### Validação de formulário (`web/lib/validations/{recurso}-form.ts`)

- Schemas **Zod** espelhando regras do Form Request (mensagens em português quando o projeto já usa assim).
- Exportar tipo dos valores, `parse…ForServer` com `safeParse` para server actions.

### Route Handlers BFF (`web/app/api/{recurso}/…`)

- Padrão `Person`: `GET`/`POST` em `route.ts`; `GET`/`PATCH`/`DELETE` em `[id]/route.ts`.
- Instanciar `Api('/prefixo-laravel')` de `@/lib/api` e repassar `searchParams` ou body; retornar `Response.json` com o payload da API.

### Dados no cliente

- `fetch('/api/...')` a partir do browser (cookie de sessão); **TanStack Query** com queryKey estável e dependente de filtros (ver `personsQueryKey` e `persons-list-page.tsx`).
- Mutations que invalidam a queryKey da lista após sucesso.

### Server actions (`'use server'`)

- Validar com Zod; montar body igual ao esperado pelo Laravel; `new Api(...).post` / `.patch`.
- Tratar `ApiError`: mapear `errors` do Laravel para `fieldErrors` por campo do formulário (ver `save-person-action.ts`).
- `revalidatePath` + `redirect` quando o fluxo for salvar e voltar à lista.

### UI

- **Lista**: componente de página reutilizável em pasta `_nome` quando houver variantes (como `_persons` + `profile`).
- **URL state**: codificar filtros/ordem/página na query string de forma compatível com `filters[field]`, `filters[field][0/1/2]` para `like` e `between`, e `orderBy[campo]` (ver `persons-url-state.ts`).
- **Formulário**: React Hook Form + `zodResolver`; campos condicionais por perfil ou tipo (ex.: modalidades só professor).
- **Tailwind 4**: seguir tokens/classes já usados no projeto (`border-border`, `bg-card`, etc.).

## Coerência API ↔ frontend

- Nomes de propriedades JSON **idênticos** aos do Resource (snake_case).
- Mesma semântica de filtros que `ServiceTrait::applyConditions` (valor escalar = `=`; array de 2 = operador + valor; array de 3 com `between` = intervalo).
- Ordenação: objeto/query `orderBy[campo]=asc|desc`.

## Referência rápida de arquivos (Person / professores)

| Camada | Caminho |
|--------|---------|
| Model | `api/app/Modules/Person/Domain/Models/Person.php` |
| Service | `api/app/Modules/Person/Domain/Services/PersonService.php` |
| Controller | `api/app/Modules/Person/Http/Controllers/PersonController.php` |
| Request | `api/app/Modules/Person/Http/Requests/PersonRequest.php` |
| Resource | `api/app/Modules/Person/Http/Resources/PersonResource.php` |
| Rotas | `api/routes/api.php` (grupo `persons`) |
| Migração | `api/database/migrations/2026_04_02_120000_create_persons_table.php` |
| Trait CRUD | `api/app/Modules/Core/Http/Traits/ControllerTrait.php` |
| Tipos | `web/types/api.ts` (`PersonAttributes`, etc.) |
| Zod | `web/lib/validations/person-form.ts` |
| BFF | `web/app/api/persons/route.ts`, `web/app/api/persons/[id]/route.ts` |
| Lista / formulário | `web/app/(private)/_persons/` |
| Páginas professores | `web/app/(private)/professores/` |

Para um CRUD **sem** pivot nem filtros especiais, usar **Modality** como modelo mais enxuto; para **regras condicionais, pivot e listagem rica**, usar **Person**.
