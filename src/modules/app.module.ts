import { diContainer } from "@fastify/awilix";
import { asValue } from "awilix";
import type { FastifyInstance } from "fastify";
import { AuthorizationModule } from "../infrastructure/auth/authorization.module.ts";
import { DatabaseModule } from "../infrastructure/database/database.module.ts";
import type { IModule } from "../shared/contracts/module.contract.ts";
import { JwtModule } from "../shared/security/jwt/jwt.module.ts";
import { UserModule } from "./user/user.module.ts";

export class AppModule implements IModule {
  private readonly infraModules: IModule[];
  private readonly featureModules: IModule[];

  constructor() {
    this.infraModules = [new DatabaseModule(), new JwtModule(), new AuthorizationModule()];

    this.featureModules = [new UserModule()];
  }

  async register(app: FastifyInstance): Promise<void> {
    diContainer.register({
      logger: asValue(app.log),
    });

    app.addHook("onRequest", async (request, _reply) => {
      request.diScope.register({
        logger: asValue(request.log),
      });
    });

    app.log.info("📦 Registrando módulos de infraestrutura...");

    for (const module of this.infraModules) {
      await module.register(app);
      app.log.info(`✅ ${module.constructor.name} registrado`);
    }

    app.log.info("📦 Registrando módulos de features...");

    for (const module of this.featureModules) {
      await module.register(app);
      app.log.info(`✅ ${module.constructor.name} registrado`);
    }
  }

  async bootstrap(app: FastifyInstance): Promise<void> {
    const allModules = [...this.infraModules, ...this.featureModules];

    for (const module of allModules) {
      if (module.bootstrap) {
        await module.bootstrap(app);
      }
    }
  }
}
