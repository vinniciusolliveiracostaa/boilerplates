import * as p from "drizzle-orm/pg-core";

export const verifications = p.pgTable("verifications", {
	id: p.uuid("id").primaryKey(),

	value: p.text("value").notNull(),
	expiresAt: p.timestamp("expires_at").notNull(),
	identifier: p.text("identifier").notNull(),

	createdAt: p.timestamp("created_at").notNull().defaultNow(),
	updatedAt: p
		.timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});
