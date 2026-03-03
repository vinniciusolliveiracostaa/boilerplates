import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { env } from "../../../../shared/config/config";
import * as schema from "./schemas";
import { relations } from "./schemas/relations";
import { DrizzleUnitOfWork } from "./unit-of-work";

export class DrizzleProvider {
  readonly client;
  readonly unitOfWork;

  constructor() {
    const pool = new SQL(env.DATABASE_URL, {
      max: 10,
      connectionTimeout: 10000,
      idleTimeout: 10000,
    });

    this.client = drizzle({
      client: pool,
      schema,
      relations,
      logger: env.NODE_ENV === "development",
      casing: "snake_case",
    });

    this.unitOfWork = new DrizzleUnitOfWork(this.client);
  }

  async healthCheck(): Promise<void> {
    await this.client.execute("SELECT 1");
  }
}

export type DrizzleClient = typeof DrizzleProvider.prototype.client;
