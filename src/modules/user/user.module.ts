import type { FastifyInstance } from "fastify";
import type { IModule } from "../../shared/contracts/module.contract";

export class UserModule implements IModule {
  async register(app: FastifyInstance): Promise<void> {}
}
