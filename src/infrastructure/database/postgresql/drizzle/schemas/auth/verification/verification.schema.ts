import * as p from "drizzle-orm/pg-core"
import { v7 as uuidV7 } from "uuid"


export const verifications = p.pgTable("verifications", {
    id: p.uuid().primaryKey().$defaultFn(() => uuidV7()),

    value: p.text("value").notNull(),
	expiresAt: p.timestamp("expires_at").notNull(),
	identifier: p.text("identifier").notNull(),

    createdAt: p.timestamp("created_at").notNull().defaultNow(),
	updatedAt: p.timestamp("updated_at").notNull().defaultNow(),
})