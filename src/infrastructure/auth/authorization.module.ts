import { asValue } from "awilix";
import type { FastifyInstance } from "fastify";
import type { IAuthorizationService } from "../../core/contracts/auth/authorization";
import type { IModule } from "../../shared/contracts/module.contract";
import { CasbinProvider } from "./casbin/casbin.provider";

let provider: CasbinProvider;

export class AuthorizationModule implements IModule {
  async register(app: FastifyInstance): Promise<void> {
    // Casbin precisa do DB pra carregar policies → resolve do container
    const db = app.diContainer.resolve("database");
    provider = await CasbinProvider.create(db);

    const resolvers = {
      authorizationService: asValue<IAuthorizationService>(provider),
    } as const;

    app.diContainer.register(resolvers);
    app.log.info("✅ AuthorizationModule registrado");
  }
}
