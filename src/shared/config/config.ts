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

	// Session
	SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
	SESSION_MAX_AGE: z.coerce.number().default(24 * 60 * 60), // 24 hours
	SESSION_COOKIE_NAME: z.string().default("auth_session"),
	SESSION_COOKIE_SECURE: z.coerce.boolean().default(false),
	SESSION_COOKIE_HTTP_ONLY: z.coerce.boolean().default(true),
	SESSION_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),

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
