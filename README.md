# Clean Architecture Boilerplate

> **Stack**: Bun · Fastify · Drizzle ORM · Awilix · Casbin · Zod · Jose
> **Architecture**: DDD + Clean Architecture with strict Dependency Rule

---

## Quick Start

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env

# Run database migrations
bunx drizzle-kit push

# Start development server
bun dev
```

---

## Project Structure

```
src/
├── core/                                  # 🏰 Pure business logic — ZERO external deps
│   ├── contracts/
│   │   ├── auth/
│   │   │   └── authorization.ts           # IAuthorizationService (ABAC contract)
│   │   ├── base-use-case.ts               # BaseUseCase + AuthorizedUseCase
│   │   ├── base-repository.ts             # Repository base with UoW
│   │   ├── base-task.ts                   # Cron/Background jobs base
│   │   └── unit-of-work.ts                # IUnitOfWork interface
│   ├── domain/
│   │   ├── aggregate-root.ts              # Entity + Domain Events
│   │   ├── domain-event.ts                # DomainEvent interface
│   │   ├── domain-event-dispatcher.ts     # In-process EventEmitter
│   │   └── entity.ts                      # Entity<T> base class
│   ├── errors/
│   │   └── index.ts                       # DomainError hierarchy
│   └── types/
│       ├── result.ts                      # Result<T, E> discriminated union
│       └── pagination.ts                  # PaginatedResult<T>
│
├── infrastructure/                        # 🔌 External implementations
│   ├── auth/
│   │   ├── authorization.module.ts        # Registers CasbinProvider into DI
│   │   └── casbin/
│   │       ├── casbin.provider.ts         # CasbinProvider implements IAuthorizationService
│   │       └── model.conf                 # RBAC model definition
│   ├── database/
│   │   ├── database.module.ts             # Registers DrizzleProvider into DI
│   │   └── postgresql/drizzle/
│   │       ├── drizzle.provider.ts        # DrizzleProvider (pool + client + UoW)
│   │       ├── unit-of-work.ts            # DrizzleUnitOfWork (AsyncLocalStorage)
│   │       └── schemas/                   # Drizzle table definitions
│   ├── health/
│   │   └── health.route.ts
│   └── providers/
│       ├── email/                          # IEmailProvider contract + implementations
│       ├── phone/                          # IPhoneProvider contract + implementations
│       ├── search/                         # ISearchProvider contract + implementations
│       └── websocket/                      # IWebSocketProvider contract + implementations
│
├── modules/                               # 📦 Bounded Contexts (feature modules)
│   └── app.module.ts                      # Orchestrates all modules
│
├── shared/                                # 🔧 Cross-cutting utilities
│   ├── config/
│   │   └── config.ts                      # Zod-validated env variables
│   ├── contracts/
│   │   └── module.contract.ts             # IModule interface
│   ├── generators/
│   │   ├── id.generator.ts                # UUIDv7 + NanoID (Bun native)
│   │   ├── hash.generator.ts              # Argon2 hashing
│   │   └── password.generator.ts
│   ├── handlers/
│   │   └── error.handler.ts               # Global error → HTTP response
│   ├── hooks/
│   │   ├── authentication.hook.ts         # JWT extraction → request.userId
│   │   └── authorization.hook.ts          # Calls IAuthorizationService.authorize()
│   ├── plugins/
│   │   ├── awilix.plugin.ts               # DI container setup
│   │   ├── cors.plugin.ts
│   │   ├── logger.plugin.ts
│   │   └── redis.plugin.ts
│   ├── security/
│   │   └── jwt/
│   │       ├── jwt.module.ts              # Registers JoseProvider into DI
│   │       └── jose/
│   │           ├── jwt.contract.ts        # IJwtProvider interface
│   │           └── jose.provider.ts       # JoseProvider (signs/verifies JWT)
│   └── types/
│       └── container.d.ts                 # Cradle type augmentation
│
├── app.ts                                 # Bootstrap (plugin registration order)
└── server.ts                              # Listen + graceful shutdown
```

---

## Dependency Rule

```
core/         ← NEVER imports from anything (zero external deps)
  ↑
modules/      ← Imports from core/ only
  ↑
infrastructure/ ← Implements core contracts using external libs
  ↑
shared/       ← Cross-cutting (plugins, hooks, config)
```

> **The golden rule**: Dependencies always point inward. External details (Fastify, Drizzle, Casbin) depend on core contracts, never the reverse.

---

## Module + Provider Pattern

Every infrastructure concern follows the same pattern:

| Concept      | Suffix           | Responsibility                          |
|--------------|------------------|-----------------------------------------|
| **Contract** | `.contract.ts`   | Pure interface (lives in `core/` or alongside provider) |
| **Provider** | `.provider.ts`   | Wraps external library, implements contract |
| **Module**   | `.module.ts`     | Registers provider into DI container     |

### The Template

```typescript
// 1. Instantiate provider at top-level
const provider = new MyProvider(config);

// 2. Define typed resolvers with asValue
const resolvers = {
  myService: asValue<IMyContract>(provider),
} as const;

// 3. Export inferred cradle type
export type MyCradle = InferCradleFromResolvers<typeof resolvers>;

// 4. Module only registers — zero logic
export class MyModule implements IModule {
  async register(app: FastifyInstance): Promise<void> {
    app.diContainer.register(resolvers);
    app.log.info("✅ MyModule registered");
  }
}
```

### Rules

1. **Always** `app.diContainer.register()`, never imported `diContainer`
2. **Always** `asValue` for singleton providers
3. **Always** `InferCradleFromResolvers` for types, never manual interfaces
4. Provider instantiated **outside** the class (top-level)
5. Module contains **zero business logic** — only DI registration

### Async Providers (Casbin example)

When a provider requires async initialization:

```typescript
export class CasbinProvider implements IAuthorizationService {
  private constructor(private readonly enforcer: Enforcer) {}

  static async create(db: DrizzleAdapterOptions["db"]): Promise<CasbinProvider> {
    const adapter = await DrizzleAdapter.newAdapter({ db, table: casbinRulePostgres });
    const enforcer = await newEnforcer(modelPath, adapter);
    await enforcer.loadPolicy();
    return new CasbinProvider(enforcer);
  }
}

// In the module:
export class AuthorizationModule implements IModule {
  async register(app: FastifyInstance): Promise<void> {
    const db = app.diContainer.resolve("database");
    provider = await CasbinProvider.create(db);
    app.diContainer.register({ authorizationService: asValue<IAuthorizationService>(provider) });
  }
}
```

### Current Modules

| Module | Provider | Contract | Registers |
|--------|----------|----------|-----------|
| `DatabaseModule` | `DrizzleProvider` | `IUnitOfWork` | `database`, `unitOfWork` |
| `JwtModule` | `JoseProvider` | `IJwtProvider` | `jwtProvider` |
| `AuthorizationModule` | `CasbinProvider` | `IAuthorizationService` | `authorizationService` |

### Registration Order (in `app.module.ts`)

```typescript
this.infraModules = [
  new DatabaseModule(),        // 1. Database first (others depend on it)
  new JwtModule(),             // 2. JWT (independent)
  new AuthorizationModule(),   // 3. Casbin (depends on database)
];
```

---

## Core Contracts

### Use Cases

```typescript
// Public route — no authorization needed
export abstract class BaseUseCase<TInput, TOutput> {
  constructor(
    protected readonly unitOfWork: IUnitOfWork,
    protected readonly logger: FastifyBaseLogger,
  ) {}
  abstract execute(input: TInput): Promise<TOutput>;
}

// Protected route — authorization required
export abstract class AuthorizedUseCase<TInput, TOutput> extends BaseUseCase<TInput, TOutput> {
  constructor(unitOfWork, logger, private readonly authorizationService: IAuthorizationService) {}

  // Throws ForbiddenError if denied
  protected async authorize(subject, action, resource, context?): Promise<void>;
  // Returns boolean without throwing
  protected async can(subject, action, resource, context?): Promise<boolean>;
}
```

### Authorization (IAuthorizationService)

```typescript
export interface IAuthorizationService {
  authorize(subject: string, action: string, resource: string, context?: AuthorizationContext): Promise<void>;
  can(subject: string, action: string, resource: string, context?: AuthorizationContext): Promise<boolean>;
  addPolicy(subject: string, action: string, resource: string): Promise<void>;
  removePolicy(subject: string, action: string, resource: string): Promise<void>;
}
```

### Error Hierarchy

All errors extend `DomainError` with `statusCode` and `code`:

| Error | Status | Code |
|-------|--------|------|
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ConflictError` | 409 | `CONFLICT` |
| `TooManyRequestsError` | 429 | `TOO_MANY_REQUESTS` |
| `InternalError` | 500 | `INTERNAL_ERROR` |

---

## Authentication & Authorization

### Hybrid Session Model

| Mechanism | Purpose | Lifetime | Storage |
|-----------|---------|----------|---------|
| **JWT (Access Token)** | Stateless identity | 15min | `Authorization: Bearer` header |
| **Session** | Long-lived refresh | 30 days (sliding window) | Database + `httpOnly` cookie |

### Hooks

```typescript
// Authentication: extracts identity from JWT
app.get("/protected", {
  preHandler: [authenticationHook],
}, handler);

// Authorization: checks Casbin policy (factory pattern)
app.get("/v1/videos", {
  preHandler: [authenticationHook, authorizationHook("read", "videos")],
}, handler);
```

### Casbin Model (RBAC)

```ini
[request_definition]
r = sub, act, obj

[policy_definition]
p = sub, act, obj

[role_definition]
g = _, _    # user inherits roles

[matchers]
m = g(r.sub, p.sub) && r.act == p.act && r.obj == p.obj
```

---

## Database

- **ORM**: Drizzle ORM (beta 1.0)
- **Driver**: `bun:sql` (Bun native PostgreSQL)
- **Transactions**: `AsyncLocalStorage`-based Unit of Work — auto-propagates tx to all repositories

```bash
# Generate migration
bunx drizzle-kit generate

# Push schema to database
bunx drizzle-kit push

# Open Drizzle Studio
bunx drizzle-kit studio
```

---

## Environment Variables

```env
# Core
NODE_ENV=development
PORT=8000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-32-char-minimum-secret-here
JWT_EXPIRES_IN=15m

# Cookie
COOKIE_SECRET=your-32-char-minimum-cookie-secret
COOKIE_NAME=auth_session
COOKIE_SECURE=false
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=lax

# Session
SESSION_EXPIRATION_DAYS=30
SESSION_REFRESH_THRESHOLD_DAYS=7

# OAuth (Google)
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_GOOGLE_REDIRECT_URI=

# CORS
CORS_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000
```

---

## Testing

```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test --coverage   # With coverage
```

### Test Pyramid

| Layer | What | How |
|-------|------|-----|
| **Unit (75%)** | Entities, VOs, Use Cases | Pure functions, mock DI deps |
| **Integration (20%)** | Repositories, Modules | Real DB (Testcontainers) |
| **E2E (5%)** | HTTP routes | Supertest against running app |

---

## Scripts

```bash
bun dev          # Development with hot reload
bun run build    # Production build
bun start        # Run production build
bun test         # Run tests
```

---

## Adding a New Feature Module

1. **Define domain** in `modules/<feature>/domain/` (entities, VOs, repository interfaces)
2. **Write use cases** in `modules/<feature>/application/` (extend `BaseUseCase` or `AuthorizedUseCase`)
3. **Implement infra** in `modules/<feature>/infrastructure/` (Drizzle repos, HTTP routes)
4. **Create module** in `modules/<feature>/<feature>.module.ts`
5. **Register** in `app.module.ts` under `featureModules`

### Adding a New Provider

1. **Create contract** (`.contract.ts`) — pure interface
2. **Create provider** (`.provider.ts`) — implements contract, wraps external lib
3. **Create module** (`.module.ts`) — registers into DI with `asValue`
4. **Add cradle type** to `container.d.ts`
5. **Register module** in `app.module.ts` under `infraModules`
