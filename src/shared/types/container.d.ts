import "@fastify/awilix";
import type { FastifyBaseLogger } from "fastify";
import type { IAuthorizationService } from "../../core/contracts/auth/authorization";
import type { DatabaseCradle } from "../../infrastructure/database/database.module";
import type { JwtCradle } from "../security/jwt/jwt.module";

declare module "@fastify/awilix" {
  interface Cradle extends DatabaseCradle, JwtCradle {
    // Core (registrado pelo AppModule)
    logger: FastifyBaseLogger;
    // Authorization (registrado pelo AuthorizationModule)
    authorizationService: IAuthorizationService;
  }
}
