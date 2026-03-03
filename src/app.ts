import Fastify from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { AppModule } from "./modules/app.module.ts";
import { env } from "./shared/config/config.ts";
import awilixPlugin from "./shared/plugins/awilix.plugin.ts";
import { corsPlugin } from "./shared/plugins/cors.plugin.ts";
import loggerPlugin from "./shared/plugins/logger.plugin.ts";
import { redisPlugin } from "./shared/plugins/redis.plugin.ts";

function getLoggerOptions() {
	if (process.stdout.isTTY) {
		return {
			level: env.NODE_ENV === "production" ? "info" : "debug",
			transport:
				env.NODE_ENV === "development"
					? {
							target: "pino-pretty",
							options: {
								colorize: true,
								ignore: "pid,hostname",
								translateTime: "SYS:HH:MM:ss",
							},
						}
					: undefined,
		};
	}
	return { level: env.NODE_ENV === "production" ? "info" : "debug" };
}

export async function buildApp() {
	const app = Fastify({
		logger: getLoggerOptions(),
	}).withTypeProvider<ZodTypeProvider>();

	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	// ============================
	// 1. FUNDAÇÃO (DI + Logging)
	// ============================
	await app.register(awilixPlugin);
	await app.register(loggerPlugin);

	// ============================
	// 2. INFRAESTRUTURA (DB + Cache)
	// ============================
	await app.register(redisPlugin);

	// ============================
	// 3. SEGURANÇA (CORS → Helmet → Rate Limit)
	// ============================
	await app.register(corsPlugin);
	// await app.register(helmetPlugin);
	// await app.register(rateLimitPlugin);

	// ============================
	// 4. PARSERS (Raw Body → Cookie)
	// ============================
	// await app.register(rawBodyPlugin);
	// await app.register(cookiePlugin);

	// ============================
	// 5. DOCUMENTAÇÃO
	// ============================
	// await app.register(swaggerPlugin);

	// ============================
	// 6. CRON JOBS
	// ============================
	// await app.register(schedulePlugin);

	// ============================
	// 7. ERROR HANDLER (antes dos módulos)
	// ============================
	// app.setErrorHandler(errorHandler);

	// ============================
	// 8. HEALTH CHECK
	// ============================
	// await app.register(healthRoute);

	// ============================
	// 9. BUSINESS MODULES
	// ============================
	const appModule = new AppModule();
	await appModule.register(app);
	await appModule.bootstrap?.(app);

	return app;
}
