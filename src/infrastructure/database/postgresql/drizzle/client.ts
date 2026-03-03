import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { env } from "../../../../shared/config/config.js";
import * as schema from "./schemas/index.js";
import { relations } from "./schemas/relations/index.js";

const Pool = new SQL(env.DATABASE_URL, {
	max: 10,
	connectionTimeout: 10000,
	idleTimeout: 10000,
});

const db = drizzle({
	client: Pool,
	schema,
	relations,
	logger: env.NODE_ENV === "development",
	casing: "snake_case",
});

export type DrizzleClient = typeof db;
