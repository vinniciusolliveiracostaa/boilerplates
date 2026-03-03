import * as p from "drizzle-orm/pg-core";

export const users = p.pgTable("users", {
	id: p.uuid("id").primaryKey(),

	emailVerified: p.boolean("email_verified").notNull().default(false),
	phoneNumberVerified: p
		.boolean("phone_number_verified")
		.notNull()
		.default(false),

	banned: p.boolean("banned").notNull().default(false),
	banReason: p.text("ban_reason"),

	createdAt: p.timestamp("created_at").notNull().defaultNow(),
	updatedAt: p
		.timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	deletedAt: p.timestamp("deleted_at"),
});
