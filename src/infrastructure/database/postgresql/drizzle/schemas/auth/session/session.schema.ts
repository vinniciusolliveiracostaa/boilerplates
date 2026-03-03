import * as p from "drizzle-orm/pg-core"
import { v7 as uuidV7 } from "uuid"
import { users } from "../../user/user.schema.js"


export const sessions = p.pgTable("sessions", {
    id: p.uuid().primaryKey().$defaultFn(() => uuidV7()),

    userId: p.uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    expiresAt: p.timestamp("expires_at").notNull(),
    token: p.text("token").notNull(),

    ipAddress: p.text("ip_address"),
    userAgent: p.text("user_agent"),
    
    createdAt: p.timestamp("created_at").notNull().defaultNow(),
	updatedAt: p.timestamp("updated_at").notNull().defaultNow(),
})