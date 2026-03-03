import { asValue, type InferCradleFromResolvers } from "awilix";
import type { FastifyInstance } from "fastify";
import { env } from "../../config/config.ts";
import type { IModule } from "../../contracts/module.contract.ts";
import { JoseProvider } from "./jose/jose.provider.ts";
import type { IJwtProvider } from "./jose/jwt.contract.ts";

const provider = new JoseProvider(env.JWT_SECRET);

const jwtResolvers = {
  jwtProvider: asValue<IJwtProvider>(provider),
} as const;

export type JwtCradle = InferCradleFromResolvers<typeof jwtResolvers>;

export class JwtModule implements IModule {
  async register(app: FastifyInstance): Promise<void> {
    app.diContainer.register(jwtResolvers);
    app.log.info("✅ JwtModule registrado");
  }
}
