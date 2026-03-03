# Clean Architecture Boilerplate — Blueprint

> **Stack**: Fastify · Drizzle · Awilix · Casbin · Zod · Bun/Node  
> **Target**: Enterprise-grade API boilerplate  
> **Baseado em**: Análise técnica do Master Síndico + correções dos problemas identificados

---

## 1. ESTRUTURA FINAL

```
src/
├── core/                              # Fundação — NUNCA depende de módulos
│   ├── contracts/
│   │   ├── base-use-case.ts           # UseCase<Input, Output> + AuthorizedUseCase
│   │   ├── base-repository.ts         # Repository base com UoW
│   │   ├── base-task.ts               # Cron/Background jobs base
│   │   └── unit-of-work.ts            # Interface UoW
│   │
│   ├── domain/
│   │   ├── aggregate-root.ts          # Entity base + Domain Events
│   │   ├── domain-event.ts            # Interface DomainEvent
│   │   ├── domain-event-dispatcher.ts # EventEmitter in-process (simples)
│   │   └── entity.ts                  # Entity base (sem events)
│   │
│   ├── errors/
│   │   └── index.ts                   # Hierarquia de erros (TODOS herdam DomainError)
│   │
│   ├── types/
│   │   ├── result.ts                  # Result<T, E> — discriminated union simples
│   │   └── pagination.ts              # PaginatedResult<T>, PaginationParams
│   │
│   └── value-objects/
│       └── index.ts                   # Re-export dos VOs base (Email, Phone, etc)
│
├── modules/                           # Bounded Contexts
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── session.entity.ts
│   │   │   │   └── account.entity.ts
│   │   │   ├── repositories/
│   │   │   │   ├── session.repository.ts      # Interface
│   │   │   │   └── account.repository.ts      # Interface
│   │   │   ├── value-objects/
│   │   │   │   └── password.vo.ts
│   │   │   └── events/
│   │   │       └── user-authenticated.event.ts
│   │   │
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       ├── sign-in.use-case.ts
│   │   │       ├── sign-up.use-case.ts
│   │   │       └── sign-out.use-case.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── repositories/              # Implementações Drizzle
│   │   │   │   ├── session.repository.impl.ts
│   │   │   │   └── account.repository.impl.ts
│   │   │   └── http/
│   │   │       └── auth.routes.ts
│   │   │
│   │   └── auth.module.ts                 # Registra DI + rotas
│   │
│   └── app.module.ts                      # Orquestra todos os módulos
│
├── infrastructure/                    # Infra compartilhada
│   ├── database/
│   │   └── drizzle/
│   │       ├── client.ts              # Conexão + DrizzleClient type
│   │       ├── unit-of-work.ts        # Implementação UoW com Drizzle
│   │       └── schemas/
│   │           ├── index.ts           # Re-export all schemas
│   │           └── relations/
│   │               └── index.ts
│   │
│   ├── auth/
│   │   └── casbin-authorization.adapter.ts
│   │
│   ├── health/
│   │   └── health.route.ts
│   │
│   └── providers/
│       ├── cache/
│       │   ├── cache.contract.ts
│       │   └── redis.provider.ts
│       ├── email/
│       │   ├── email.contract.ts
│       │   └── resend.provider.ts     # ou twilio
│       ├── phone/
│       │   ├── phone.contract.ts
│       │   └── twilio.provider.ts
│       ├── search/
│       │   ├── search.contract.ts
│       │   └── opensearch.provider.ts
│       └── websocket/
│           ├── websocket.contract.ts
│           └── websocket.provider.ts
│
├── shared/                            # Utilitários cross-cutting
│   ├── config/
│   │   └── env.ts                     # Zod schema → env tipado
│   ├── contracts/
│   │   └── module.contract.ts
│   ├── handlers/
│   │   └── error.handler.ts
│   ├── hooks/
│   │   ├── authenticate.hook.ts
│   │   └── authorize.hook.ts
│   ├── plugins/
│   │   ├── awilix.plugin.ts
│   │   ├── cookie.plugin.ts
│   │   ├── cors.plugin.ts
│   │   ├── helmet.plugin.ts
│   │   ├── logger.plugin.ts
│   │   ├── rate-limit.plugin.ts
│   │   ├── raw-body.plugin.ts         # Webhooks
│   │   ├── redis.plugin.ts
│   │   ├── schedule.plugin.ts
│   │   └── swagger.plugin.ts
│   └── utils/
│       └── id-generator.ts            # UUIDv7
│
├── app.ts                             # Bootstrap (plugin order matters)
└── server.ts                          # Listen + graceful shutdown
```

### Regras de Dependência (Invioláveis)

```
core/ ← NÃO importa de NADA (zero deps externas exceto types)
  ↑
modules/domain/ ← Importa apenas de core/
  ↑
modules/application/ ← Importa de core/ + domain/ do mesmo módulo
  ↑
modules/infrastructure/ ← Importa de tudo acima + libs externas
  ↑
infrastructure/ ← Implementações concretas (Drizzle, Redis, etc)
  ↑
shared/ ← Cross-cutting (plugins, hooks, handlers)
```

---

## 2. CORE CONTRACTS

### 2.1 Result<T, E> — Sem Effect-TS, sem overhead

```typescript
// src/core/types/result.ts

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  ok: <T>(data: T): Result<T, never> => ({ success: true, data }),
  fail: <E>(error: E): Result<never, E> => ({ success: false, error }),
} as const;

// Uso:
// const result = Result.ok(user);
// const result = Result.fail(new NotFoundError("User"));
// if (result.success) { result.data } else { result.error }
```

**Por que isso e não Effect-TS?** Discriminated union nativa do TS. Zero dependência, zero curva de aprendizado, mesma type-safety. Effect-TS fica pra quando/se o projeto realmente precisar de fibers/scheduling/layers.

---

### 2.2 Error Hierarchy — TODOS herdam DomainError

```typescript
// src/core/errors/index.ts

export abstract class DomainError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class ValidationError extends DomainError {
  readonly statusCode = 400;
  readonly code = "VALIDATION_ERROR";
}

export class NotFoundError extends DomainError {
  readonly statusCode = 404;
  readonly code = "NOT_FOUND";

  constructor(resource: string, details?: Record<string, unknown>) {
    super(`${resource} não encontrado`, details);
  }
}

export class UnauthorizedError extends DomainError {
  readonly statusCode = 401;
  readonly code = "UNAUTHORIZED";

  constructor(message = "Não autorizado") {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly statusCode = 403;
  readonly code = "FORBIDDEN";

  constructor(message = "Ação não permitida") {
    super(message);
  }
}

export class ConflictError extends DomainError {
  readonly statusCode = 409;
  readonly code = "CONFLICT";

  constructor(message = "Conflito de dados") {
    super(message);
  }
}

export class BusinessError extends DomainError {
  readonly statusCode = 400;

  constructor(
    message: string,
    readonly code: string = "BUSINESS_ERROR",
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}

// CORRIGIDO: Agora herda de DomainError (problema do Master Síndico)
export class TooManyRequestsError extends DomainError {
  readonly statusCode = 429;
  readonly code = "TOO_MANY_REQUESTS";

  constructor(message = "Muitas requisições") {
    super(message);
  }
}

export class QuotaExceededError extends DomainError {
  readonly statusCode = 429;
  readonly code = "QUOTA_EXCEEDED";

  constructor(
    message = "Limite de recursos atingido",
    details?: Record<string, unknown>,
  ) {
    super(message, details);
  }
}

export class InternalError extends DomainError {
  readonly statusCode = 500;
  readonly code = "INTERNAL_ERROR";

  constructor(message = "Erro interno inesperado") {
    super(message);
  }
}
```

---

### 2.3 Entity + AggregateRoot com Domain Events

```typescript
// src/core/domain/entity.ts

export abstract class Entity<T extends string = string> {
  protected constructor(protected readonly _id: T) {}

  getId(): T {
    return this._id;
  }

  equals(other: Entity<T>): boolean {
    return this._id === other._id;
  }
}
```

```typescript
// src/core/domain/domain-event.ts

export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}
```

```typescript
// src/core/domain/aggregate-root.ts

import type { DomainEvent } from "./domain-event";
import { Entity } from "./entity";

export abstract class AggregateRoot<T extends string = string> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}
```

```typescript
// src/core/domain/domain-event-dispatcher.ts

import type { DomainEvent } from "./domain-event";

type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>;

export class DomainEventDispatcher {
  private handlers = new Map<string, EventHandler[]>();

  register<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventName, existing);
  }

  async dispatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const handlers = this.handlers.get(event.eventName) ?? [];
      await Promise.allSettled(
        handlers.map((handler) => handler(event)),
      );
    }
  }
}
```

**Nota**: `Promise.allSettled` em vez de `Promise.all` — um handler falhando não quebra os outros. Logs de falha ficam no handler individual.

---

### 2.4 BaseUseCase — Authorize que FALHA em prod

```typescript
// src/core/contracts/base-use-case.ts

import type { FastifyBaseLogger } from "fastify";
import type { IUnitOfWork } from "./unit-of-work";
import { ForbiddenError, InternalError } from "../errors";

export interface IAuthorizationService {
  authorize(action: string, subject: string, conditions?: Record<string, unknown>): void;
  can(action: string, subject: string, conditions?: Record<string, unknown>): boolean;
}

export abstract class BaseUseCase<TInput, TOutput> {
  constructor(
    protected readonly unitOfWork: IUnitOfWork,
    protected readonly logger: FastifyBaseLogger,
  ) {}

  abstract execute(input: TInput): Promise<TOutput>;

  protected async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.unitOfWork.execute(fn);
  }
}

/**
 * Use case que REQUER autorização.
 * Se authorizationService não for injetado, LANÇA ERRO (não loga warn).
 *
 * Corrige o problema do Master Síndico onde authorize() era silencioso.
 */
export abstract class AuthorizedUseCase<TInput, TOutput> extends BaseUseCase<TInput, TOutput> {
  constructor(
    unitOfWork: IUnitOfWork,
    logger: FastifyBaseLogger,
    private readonly authorizationService: IAuthorizationService,
  ) {
    super(unitOfWork, logger);
  }

  /**
   * Lança ForbiddenError se não tem permissão.
   * Lança InternalError se service não foi injetado (bug de config).
   */
  protected authorize(action: string, subject: string, conditions?: Record<string, unknown>): void {
    if (!this.authorizationService) {
      // ERRO, não warning. Isso é bug de configuração.
      throw new InternalError(
        `AuthorizationService não injetado em ${this.constructor.name}. ` +
        "Use BaseUseCase se a rota é pública.",
      );
    }
    this.authorizationService.authorize(action, subject, conditions);
  }

  protected can(action: string, subject: string, conditions?: Record<string, unknown>): boolean {
    if (!this.authorizationService) {
      throw new InternalError(
        `AuthorizationService não injetado em ${this.constructor.name}.`,
      );
    }
    return this.authorizationService.can(action, subject, conditions);
  }
}
```

**Separação clara**: `BaseUseCase` para rotas públicas, `AuthorizedUseCase` para rotas protegidas. Sem ambiguidade.

---

### 2.5 BaseRepository

```typescript
// src/core/contracts/base-repository.ts

import type { FastifyBaseLogger } from "fastify";
import type { IUnitOfWork } from "./unit-of-work";

export abstract class BaseRepository {
  constructor(
    protected readonly unitOfWork: IUnitOfWork,
    protected readonly logger: FastifyBaseLogger,
  ) {}

  /**
   * Retorna o client correto: transação ativa ou conexão padrão.
   * O UoW gerencia qual client usar.
   */
  protected get db() {
    return this.unitOfWork.getClient();
  }
}
```

---

### 2.6 UnitOfWork Interface

```typescript
// src/core/contracts/unit-of-work.ts

export interface IUnitOfWork {
  /**
   * Executa callback dentro de transação.
   * Se já existe transação ativa (nested), reutiliza a mesma.
   */
  execute<T>(fn: () => Promise<T>): Promise<T>;

  /**
   * Retorna client da transação ativa ou conexão padrão.
   */
  getClient(): unknown; // Tipado na implementação concreta
}
```

---

### 2.7 Pagination

```typescript
// src/core/types/pagination.ts

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      page: params.page,
      perPage: params.perPage,
      total,
      totalPages: Math.ceil(total / params.perPage),
    },
  };
}
```

---

### 2.8 BaseTask

```typescript
// src/core/contracts/base-task.ts

import type { FastifyBaseLogger } from "fastify";
import type { IUnitOfWork } from "./unit-of-work";

export abstract class BaseTask {
  constructor(
    protected readonly unitOfWork: IUnitOfWork,
    protected readonly logger: FastifyBaseLogger,
  ) {}

  abstract handleCron(): Promise<void>;

  protected async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.unitOfWork.execute(fn);
  }

  /**
   * Wrapper com error handling e logging automático.
   * Use isso no scheduler em vez de chamar handleCron() direto.
   */
  async safeExecute(): Promise<void> {
    const taskName = this.constructor.name;
    const start = Date.now();

    try {
      this.logger.info({ task: taskName }, "Task started");
      await this.handleCron();
      this.logger.info({ task: taskName, durationMs: Date.now() - start }, "Task completed");
    } catch (error) {
      this.logger.error({ task: taskName, error, durationMs: Date.now() - start }, "Task failed");
    }
  }
}
```

---

## 3. INFRASTRUCTURE IMPLEMENTATIONS

### 3.1 Drizzle UnitOfWork

```typescript
// src/infrastructure/database/drizzle/unit-of-work.ts

import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { IUnitOfWork } from "../../../core/contracts/unit-of-work";
import { AsyncLocalStorage } from "node:async_hooks";

export type DrizzleClient = NodePgDatabase<Record<string, never>>;

const txStorage = new AsyncLocalStorage<DrizzleClient>();

export class DrizzleUnitOfWork implements IUnitOfWork {
  constructor(private readonly db: DrizzleClient) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Se já está numa transação, reutiliza (nested)
    const existingTx = txStorage.getStore();
    if (existingTx) {
      return fn();
    }

    return this.db.transaction(async (tx) => {
      return txStorage.run(tx as DrizzleClient, fn);
    });
  }

  getClient(): DrizzleClient {
    return txStorage.getStore() ?? this.db;
  }
}
```

**AsyncLocalStorage** resolve o problema de propagar transação sem passar como parâmetro. Qualquer repository chamado dentro do `execute()` automaticamente usa o tx.

---

### 3.2 Drizzle Client

```typescript
// src/infrastructure/database/drizzle/client.ts

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../../../shared/config/env";
import * as schema from "./schemas";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,                 // Pool máximo
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema, logger: env.NODE_ENV === "development" });

export type DrizzleClient = typeof db;
```

---

### 3.3 Env com Zod

```typescript
// src/shared/config/env.ts

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default("0.0.0.0"),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  SESSION_EXPIRATION_DAYS: z.coerce.number().default(30),
  SESSION_REFRESH_THRESHOLD_DAYS: z.coerce.number().default(7),
  COOKIE_SECRET: z.string().min(32),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Providers
  RESEND_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  OPENSEARCH_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

---

### 3.4 Error Handler

```typescript
// src/shared/handlers/error.handler.ts

import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { DomainError, ValidationError } from "../../core/errors";
import { ZodError } from "zod";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  // Domain errors — controlados
  if (error instanceof DomainError) {
    reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  // Zod validation — transforma em ValidationError
  if (error instanceof ZodError) {
    const formatted = error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));

    reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: { issues: formatted },
    });
    return;
  }

  // Rate limit do Fastify
  if (error.statusCode === 429) {
    reply.status(429).send({
      error: "TOO_MANY_REQUESTS",
      message: error.message,
    });
    return;
  }

  // Qualquer outro erro — 500 genérico (não vaza detalhes)
  request.log.error({ err: error }, "Unhandled error");

  reply.status(500).send({
    error: "INTERNAL_ERROR",
    message: "Erro interno inesperado",
  });
}
```

---

### 3.5 Module Contract

```typescript
// src/shared/contracts/module.contract.ts

import type { FastifyInstance } from "fastify";

export interface IModule {
  /**
   * Registra dependências no container DI e rotas no Fastify.
   */
  register(app: FastifyInstance): Promise<void>;

  /**
   * Bootstrap: inicializa serviços (cron jobs, event handlers, etc).
   * Chamado DEPOIS de todos os módulos serem registrados.
   */
  bootstrap?(app: FastifyInstance): Promise<void>;
}
```

---

### 3.6 Redis Plugin com Retry

```typescript
// src/shared/plugins/redis.plugin.ts (corrige problema do Master Síndico)

import type { FastifyInstance } from "fastify";
import fastifyRedis from "@fastify/redis";
import { env } from "../config/env";

export async function redisPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRedis, {
    url: env.REDIS_URL,
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 10) return null; // Para de tentar
      return Math.min(times * 200, 5000); // Backoff: 200ms, 400ms, ..., 5s
    },
    connectTimeout: 5000,
  });

  // Validar conexão
  try {
    await app.redis.ping();
    app.log.info("Redis connected");
  } catch (err) {
    app.log.error({ err }, "Redis connection failed");
    throw err; // Não inicia app sem Redis
  }
}
```

---

### 3.7 CORS Plugin seguro

```typescript
// src/shared/plugins/cors.plugin.ts (corrige vulnerabilidade do Master Síndico)

import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { env } from "../config/env";

export async function corsPlugin(app: FastifyInstance): Promise<void> {
  const origins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

  // BLOQUEIO: wildcard + credentials = vulnerabilidade
  if (origins.includes("*")) {
    app.log.warn("CORS wildcard detected — credentials disabled");
  }

  await app.register(cors, {
    origin: origins.includes("*") ? true : origins,
    credentials: !origins.includes("*"), // NUNCA credentials com wildcard
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}
```

---

## 4. APP BOOTSTRAP — ORDEM IMPORTA

```typescript
// src/app.ts

import Fastify from "fastify";
import { env } from "./shared/config/env";
import { errorHandler } from "./shared/handlers/error.handler";

// Plugins
import { awilixPlugin } from "./shared/plugins/awilix.plugin";
import { loggerPlugin } from "./shared/plugins/logger.plugin";
import { redisPlugin } from "./shared/plugins/redis.plugin";
import { corsPlugin } from "./shared/plugins/cors.plugin";
import { helmetPlugin } from "./shared/plugins/helmet.plugin";
import { rateLimitPlugin } from "./shared/plugins/rate-limit.plugin";
import { cookiePlugin } from "./shared/plugins/cookie.plugin";
import { rawBodyPlugin } from "./shared/plugins/raw-body.plugin";
import { swaggerPlugin } from "./shared/plugins/swagger.plugin";
import { schedulePlugin } from "./shared/plugins/schedule.plugin";

// Health + Modules
import { healthRoute } from "./infrastructure/health/health.route";
import { AppModule } from "./modules/app.module";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport: process.stdout.isTTY
        ? { target: "pino-pretty", options: { ignore: "pid,hostname" } }
        : undefined,
    },
  });

  // ============================
  // 1. FUNDAÇÃO (DI + Logging)
  // ============================
  await app.register(awilixPlugin);

  // ============================
  // 2. INFRAESTRUTURA (DB + Cache)
  // ============================
  await app.register(redisPlugin);

  // ============================
  // 3. SEGURANÇA (CORS → Helmet → Rate Limit)
  // ============================
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(rateLimitPlugin);

  // ============================
  // 4. PARSERS (Raw Body → Cookie)
  // ============================
  await app.register(rawBodyPlugin);
  await app.register(cookiePlugin);

  // ============================
  // 5. DOCUMENTAÇÃO
  // ============================
  await app.register(swaggerPlugin);

  // ============================
  // 6. CRON JOBS
  // ============================
  await app.register(schedulePlugin);

  // ============================
  // 7. ERROR HANDLER (antes dos módulos)
  // ============================
  app.setErrorHandler(errorHandler);

  // ============================
  // 8. HEALTH CHECK
  // ============================
  await app.register(healthRoute);

  // ============================
  // 9. BUSINESS MODULES
  // ============================
  const appModule = new AppModule();
  await appModule.register(app);
  await appModule.bootstrap?.(app);

  return app;
}
```

---

## 5. SERVER — GRACEFUL SHUTDOWN CORRETO

```typescript
// src/server.ts

import closeWithGrace from "close-with-grace";
import { buildApp } from "./app";
import { env } from "./shared/config/env";

async function main() {
  const app = await buildApp();

  // Graceful shutdown com timeout
  closeWithGrace({ delay: 5000 }, async ({ signal, err }) => {
    if (err) {
      app.log.error({ err }, "Server closing due to error");
    } else {
      app.log.info({ signal }, "Server shutting down");
    }

    // Dispõe DI container (fecha pools, connections, etc)
    await app.diContainer?.dispose();
    await app.close();
  });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Server running at http://${env.HOST}:${env.PORT}`);
    app.log.info(`Docs at http://${env.HOST}:${env.PORT}/docs`);
  } catch (err) {
    app.log.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
}

main();
```

---

## 6. PATTERNS: O QUE IMPLEMENTAR E QUANDO

### AGORA (Sprint 1-2)

| Pattern | Onde | Por quê |
|---------|------|---------|
| **Domain Events** | `core/domain/` | Desacoplamento de side effects (changeEmail → invalidar sessões) |
| **Result<T, E>** | `core/types/` | Error handling explícito sem try-catch hell |
| **UoW + AsyncLocalStorage** | `infrastructure/database/` | Transações automáticas sem prop drilling |
| **Error Hierarchy** | `core/errors/` | Consistência em toda API |
| **Separated UseCase/AuthorizedUseCase** | `core/contracts/` | Authorize nunca é silencioso |
| **Env validation com Zod** | `shared/config/` | Fail-fast na inicialização |

### DEPOIS (Sprint 3-6)

| Pattern | Quando | Por quê |
|---------|--------|---------|
| **CQRS leve** (queries direto no SQL, commands via entities) | Quando tiver queries pesadas de listagem | Reads otimizados sem carregar aggregates |
| **Cache com invalidação** (Redis + TTL) | Quando tiver endpoints hot (permissions, plans) | Performance |
| **Distributed Lock** (Redis SET NX EX) | Quando tiver operações de quota/counter | Race conditions |
| **Webhook idempotency** (dedup por event ID) | Quando integrar Stripe/payment | Processamento duplicado |

### NÃO IMPLEMENTAR (a menos que prove necessidade)

| Pattern | Por quê não |
|---------|-------------|
| **Event Sourcing** | Complexidade absurda, zero ganho para CRUD de condomínios |
| **Saga Orchestrator** | Prefira compensating transactions simples caso a caso |
| **Specification Pattern** | Drizzle já compõe queries nativamente com `and()`, `or()` |
| **Effect-TS** | Curva alta, Result<T,E> resolve 95% dos casos |
| **Temporal.io** | BullMQ + Redis resolve. Temporal é pra workflows de longa duração distribuídos |

---

## 7. TESTES — SETUP DESDE O DIA 1

```
package.json scripts:
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:integration": "vitest run --config vitest.integration.config.ts"
```

### Pirâmide

```
        /\
       /  \   E2E: Supertest → rotas HTTP (5%)
      /----\
     /      \  Integration: Testcontainers + Drizzle (20%)
    /--------\
   /          \ Unit: Entities, VOs, UseCases com mocks (75%)
  /____________\
```

### Exemplo Unit Test (Entity)

```typescript
import { describe, it, expect } from "vitest";

describe("User Entity", () => {
  it("should add domain event on email change", () => {
    const user = User.create({ ... });
    user.changeEmail(new EmailVO("new@email.com"));

    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe("user.email.changed");
  });

  it("should not allow banned user to change email", () => {
    const user = User.create({ ... });
    user.ban();

    expect(() => user.changeEmail(new EmailVO("new@email.com")))
      .toThrow(BusinessError);
  });
});
```

---

## 8. CHECKLIST DO BOILERPLATE

### Arquivos Core (criar primeiro)
- [ ] `src/core/types/result.ts`
- [ ] `src/core/types/pagination.ts`
- [ ] `src/core/errors/index.ts`
- [ ] `src/core/domain/entity.ts`
- [ ] `src/core/domain/aggregate-root.ts`
- [ ] `src/core/domain/domain-event.ts`
- [ ] `src/core/domain/domain-event-dispatcher.ts`
- [ ] `src/core/contracts/unit-of-work.ts`
- [ ] `src/core/contracts/base-use-case.ts`
- [ ] `src/core/contracts/base-repository.ts`
- [ ] `src/core/contracts/base-task.ts`

### Infra (criar segundo)
- [ ] `src/shared/config/env.ts` (Zod)
- [ ] `src/shared/handlers/error.handler.ts`
- [ ] `src/shared/contracts/module.contract.ts`
- [ ] `src/infrastructure/database/drizzle/client.ts`
- [ ] `src/infrastructure/database/drizzle/unit-of-work.ts`
- [ ] Todos os plugins em `src/shared/plugins/`

### Bootstrap (criar terceiro)
- [ ] `src/app.ts`
- [ ] `src/server.ts`
- [ ] `src/modules/app.module.ts`

### Testing (configurar junto)
- [ ] `vitest.config.ts`
- [ ] `vitest.integration.config.ts`
- [ ] `docker-compose.yml` (Postgres + Redis, versões fixas)
- [ ] `.env.example`

### Depois: Primeiro módulo (Auth como referência)
- [ ] Domain: entities, repositories interfaces, value objects, events
- [ ] Application: use cases (sign-in, sign-up, sign-out)
- [ ] Infrastructure: repository impls, routes
- [ ] Module file: DI registration

---

## 9. DOCKER-COMPOSE (versões fixas, sem senhas hardcoded)

```yaml
services:
  postgres:
    image: postgres:17.2-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-app}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}
      POSTGRES_DB: ${POSTGRES_DB:-app}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-app}"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7.4-alpine
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

---

**FIM DO BLUEPRINT**

Esse documento é o norte. Cada arquivo tem um propósito claro, cada pattern tem uma justificativa, e nada foi adicionado "por moda".

A regra de ouro: **se não resolve um problema que você tem AGORA, não implementa.**
