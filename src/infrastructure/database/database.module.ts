import { asValue, type InferCradleFromResolvers } from "awilix";
import type { FastifyInstance } from "fastify";
import type { IModule } from "../../shared/contracts/module.contract";
import { DrizzleProvider } from "./postgresql/drizzle/drizzle.provider";

const provider = new DrizzleProvider();

const databaseResolvers = {
  database: asValue(provider.client),
  unitOfWork: asValue(provider.unitOfWork),
} as const;

export type DatabaseCradle = InferCradleFromResolvers<typeof databaseResolvers>;

export class DatabaseModule implements IModule {
  async register(app: FastifyInstance): Promise<void> {
    app.diContainer.register(databaseResolvers);
    app.log.info("✅ DatabaseModule registrado");
  }
  async bootstrap(app: FastifyInstance): Promise<void> {
    try {
      await provider.healthCheck();
      app.log.info("✅ Database connection verified");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      app.log.error(`❌ Database connection failed: ${msg}`);
      throw new Error(`Database bootstrap failed: ${msg}`);
    }
  }
}
