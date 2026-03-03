import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().default(8000),
	HOST: z.string().default("0.0.0.0"),
	LOG_LEVEL: z
		.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
		.default("silent"),

	// Database
	DATABASE_URL: z.url().min(1, "DATABASE_URL is required"),

	// Redis
	REDIS_URL: z.string().min(1, "REDIS_URL is required"),

	// OAuth
	// GOOGLE
	OAUTH_GOOGLE_CLIENT_ID: z
		.string()
		.min(1, "OAUTH_GOOGLE_CLIENT_ID is required"),
	OAUTH_GOOGLE_CLIENT_SECRET: z
		.string()
		.min(1, "OAUTH_GOOGLE_CLIENT_SECRET is required"),
	OAUTH_GOOGLE_REDIRECT_URI: z
		.string()
		.min(1, "OAUTH_GOOGLE_REDIRECT_URI is required"),

	// JWT (Access Token — stateless, curto)
	JWT_SECRET: z
		.string()
		.min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
	JWT_EXPIRES_IN: z.string().default("15m"),

	// Cookie (assina o cookie httpOnly que carrega o session token)
	COOKIE_SECRET: z
		.string()
		.min(32, "COOKIE_SECRET deve ter pelo menos 32 caracteres"),
	COOKIE_NAME: z.string().default("auth_session"),
	COOKIE_SECURE: z.coerce.boolean().default(false),
	COOKIE_HTTP_ONLY: z.coerce.boolean().default(true),
	COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),

	// Session (server-side no banco — longa, sliding window)
	SESSION_EXPIRATION_DAYS: z.coerce.number().default(30),
	SESSION_REFRESH_THRESHOLD_DAYS: z.coerce.number().default(7),

	// CORS
	CORS_ORIGINS: z
		.union([z.string(), z.array(z.string())])
		.transform((val) => {
			if (val === "*") return ["*"];
			if (typeof val === "string") {
				return val.split(",").map((v) => v.trim());
			}
			return val;
		})
		.default(["*"]),

	// Rate Limiting
	RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(1000),
	RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
});

export type Env = z.infer<typeof envSchema>;
function validateEnv(): Env {
	const result = envSchema.safeParse(Bun.env);

	if (!result.success) {
		console.error("❌ Invalid environment variables:");
		console.error(
			"Invalid environment variables:",
			z.treeifyError(result.error),
		);
		process.exit(1);
	}
	return result.data;
}
export const env = validateEnv();
