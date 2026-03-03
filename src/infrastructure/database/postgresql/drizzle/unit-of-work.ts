import { AsyncLocalStorage } from "node:async_hooks";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql/postgres/driver";
import type { IUnitOfWork } from "../../../../core/contracts/unit-of-work";

export type DrizzleClient = BunSQLDatabase<Record<string, never>>;

const txStorage = new AsyncLocalStorage<DrizzleClient>();

export class DrizzleUnitOfWork implements IUnitOfWork {
	constructor(private readonly db: DrizzleClient) {}

	async execute<T>(fn: () => Promise<T>): Promise<T> {
		// Se já está numa transação, reutiliza (nested)
		const existingTx = txStorage.getStore();
		if (existingTx) {
			return fn();
		}

		return this.db.transaction(async (tx) => {
			return txStorage.run(tx as DrizzleClient, fn);
		});
	}

	getClient(): DrizzleClient {
		return txStorage.getStore() ?? this.db;
	}
}
