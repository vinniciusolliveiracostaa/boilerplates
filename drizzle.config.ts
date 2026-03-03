import { defineConfig } from "drizzle-kit";
import { env } from "./src/shared/config/config.js";

export default defineConfig({
  schema: "./src/infrastructure/database/postgresql/drizzle/schemas",
  out: "./src/infrastructure/database/postgresql/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  casing: "snake_case",
});
