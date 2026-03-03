import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {env} from "../../shared/config/config";

const healthResponseSchema = z.object({
    status: z.literal("ok"),
    timestamp: z.string(),
    uptime: z.number(),
    environment: z.string(),
});

export async function healthRoute(app: FastifyInstance) {
    const typedApp = app.withTypeProvider<ZodTypeProvider>();

    typedApp.get(
        "/health",
        {
            schema: {
                tags: ["Health"],
                description: "Health check endpoint",
                response: {
                    200: healthResponseSchema,
                },
            },
        },
        async () => {
            return {
                status: "ok" as const,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: env.NODE_ENV || "development",
            };
        },
    );
}
