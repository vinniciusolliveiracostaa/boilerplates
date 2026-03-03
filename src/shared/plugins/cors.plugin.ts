import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { env } from "../config/config";

export async function corsPlugin(app: FastifyInstance): Promise<void> {
	const origins = env.CORS_ORIGINS;

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
