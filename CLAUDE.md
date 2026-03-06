# SmartTrack Health - CLAUDE.md

## Project Overview

SmartTrack Health is an enterprise HIPAA-compliant care documentation and billing platform for IDD service providers. NestJS backend API with PostgreSQL, multi-tenant RLS, 7 isolated consoles.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: NestJS 11
- **Database**: PostgreSQL with Row-Level Security
- **ORM**: TypeORM (AbstractModelAction + DAL pattern)
- **Auth**: Local JWT (HS256) + bcrypt passwords + Google OAuth ID token
- **Package Manager**: pnpm
- **Testing**: Jest (unit) + Supertest (e2e)
- **Linting**: ESLint (flat config) + Prettier

## Commands

- `pnpm start:dev` — Start dev server with watch
- `pnpm build` — Production build
- `pnpm test` — Run unit tests
- `pnpm test:e2e` — Run e2e tests
- `pnpm test:cov` — Tests with coverage
- `pnpm lint` — Lint and auto-fix
- `pnpm format` — Format with Prettier
- `pnpm migration:generate` — Generate TypeORM migration
- `pnpm migration:run` — Run migrations
- `pnpm migration:revert` — Revert last migration

## Project Structure (Flat Architecture)

```
src/
  controllers/          # All route controllers + base.controller.ts registry
  services/             # All business logic services + base.service.ts registry
  dals/                 # Data Access Layers (extend AbstractModelAction<T>)
  dtos/                 # Data Transfer Objects (validation)
  entities/             # TypeORM entities (base.entity.ts, tenant-base.entity.ts)
  enums/                # Enumerations (roles, statuses, etc.)
  types/                # TypeScript type definitions
  utils/                # Utility functions (camelToSnake, pagination, etc.)
  decorators/           # Custom decorators (@CurrentUser, @Roles, @Public, @PrivateFields)
  guards/               # Auth guards (JwtAuthGuard, RolesGuard)
  interceptors/         # Response interceptor (standard envelope, PHI stripping)
  exceptions/           # Exception filters (AllExceptionsFilter — PHI-safe)
  database/             # Database module, data-source, migrations, AbstractModelAction
    options/            # Generic CRUD type definitions
    migrations/         # TypeORM migration files
  imports.ts            # Module imports registry
  app.module.ts         # Root module (wires imports, controllers, services)
  main.ts               # Bootstrap (validation, CORS, helmet, Swagger)
```

## Architecture Pattern

- **Single AppModule** — no NestJS feature modules. All controllers/services registered via `base.controller.ts` and `base.service.ts` registries
- **DAL Pattern** — each entity gets a DAL class extending `AbstractModelAction<T>` for type-safe CRUD
- **Path Aliases** — `@controllers/*`, `@services/*`, `@dals/*`, `@entities/*`, `@enums/*`, `@utils/*`, `@decorators/*`, `@guards/*`, `@interceptors/*`, `@exceptions/*`, `@dtos/*`, `@database/*`, `@app-types/*`
- **No .js suffixes** in imports

## Code Conventions

### Naming

- Files: `kebab-case` (e.g., `service-record.entity.ts`, `billing-queue.service.ts`)
- Classes: `PascalCase` (e.g., `ServiceRecordService`, `ClaimEntity`)
- Variables/functions: `camelCase`
- Database tables/columns: `snake_case`
- API routes: `/api/v1/{console}/resource` (e.g., `/api/v1/billing/claims`)
- Enum values: `UPPER_SNAKE_CASE`

### Formatting (enforced by Prettier)

- Single quotes
- Trailing commas (all)

### Adding a New Feature

1. Create entity in `entities/`
2. Create DAL in `dals/` extending `AbstractModelAction<T>`
3. Create service in `services/`
4. Create controller in `controllers/`
5. Create DTOs in `dtos/`
6. Register in `base.service.ts` and `base.controller.ts`
7. Register entity in `imports.ts` via `TypeOrmModule.forFeature([])`
8. Write spec files alongside each file

## Critical Rules — NEVER VIOLATE

### 1. Money in Cents

All financial values are stored and calculated as integers (cents). Never use floating point for money. Display formatting happens only at the presentation layer.

```typescript
// CORRECT
const amount = 15099; // $150.99
// WRONG
const amount = 150.99;
```

### 2. No PHI Leakage

PHI must NEVER appear in:

- URL paths or query parameters
- Log output (use structured logging with PHI fields excluded)
- Error messages returned to clients
- Stack traces
  Use resource IDs (UUIDs) in URLs, never names/SSNs/DOBs.

### 3. RLS Enforcement

Every table containing tenant data MUST have `org_id` column with RLS policy. Never bypass RLS. The tenant context middleware sets `app.current_org_id` on every request.

### 4. Console Isolation

API endpoints are namespaced per console. A billing controller serves `/api/v1/billing/*` only. Never create cross-console endpoints.

### 5. 404 Not 403

When a user requests a resource outside their scope (wrong tenant, wrong role), return 404 — never 403. This prevents resource enumeration attacks.

### 6. Immutable Approved Records

Once a service record reaches APPROVED status, it cannot be modified. Corrections are append-only amendments that reference the original.

### 7. Claims from Approved Only

Claims can ONLY be generated from service records with status = APPROVED. This must be enforced at the database layer (CHECK constraint or trigger), not just application code.

### 8. Append-Only Audit Logs

Audit log tables have no UPDATE or DELETE permissions. Every PHI access, mutation, login, and role change is logged with: who, what, when, from_where, org_id.

### 9. Field-Level Encryption

PHI columns (SSN, DOB, diagnosis, etc.) use AES-256 encryption. Encryption/decryption happens in the application layer via the encryption service. Encrypted values are stored as bytea or text.

### 10. State Machine Integrity

Service records and claims follow strict state machines. Validate transitions — never allow skipping states (e.g., DRAFT cannot go directly to APPROVED).

## Testing Requirements

Every feature must have spec files. Definition of Done:

1. Unit tests for service, controller, guard, interceptor logic
2. RLS-tested with multiple tenant contexts
3. Role-permission matrix enforced and tested
4. Audit log entries verified in tests
5. PHI encrypted at field level where applicable
6. No PHI in logs/URLs/errors (verified)
7. E2e test passing with realistic data

## Error Response Format

```json
{
  "status_code": 404,
  "message": "Resource not found",
  "error": "Not Found",
  "timestamp": "2026-03-06T12:00:00.000Z",
  "path": "/api/v1/billing/claims/uuid",
  "success": false
}
```

Never include entity details, PHI, or internal state in error responses.

## Git Commits

- No Co-Authored-By tags. Just a clear, descriptive commit message.
- Keep messages concise — focus on _what_ and _why_, not _how_.

## Key Documents

- `plan.md` — Full development plan with phases
- `progress.md` — Progress tracking
- `agent.md` — Agent workflow configuration
- `docs/` — Product specifications and reference materials
