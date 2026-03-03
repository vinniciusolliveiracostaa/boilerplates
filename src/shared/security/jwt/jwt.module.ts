import { asFunction, Lifetime } from "awilix";
import type { FastifyInstance } from "fastify";
import { env } from "../../config/config";
import type { IModule } from "../../contracts/module.contract";
import { JoseProvider } from "./jose.provider";

export class JwtModule implements IModule {
	async register(app: FastifyInstance): Promise<void> {
		app.diContainer.register({
			jwtProvider: asFunction(
				() => new JoseProvider(env.JWT_SECRET),
				{ lifetime: Lifetime.SINGLETON }, // Stateless, pode ser singleton
			),
		});
		app.log.info("✅ JwtModule registrado");
	}
}
