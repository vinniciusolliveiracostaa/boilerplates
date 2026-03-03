import { sql } from "drizzle-orm";
import * as p from "drizzle-orm/pg-core";

export const users = p.pgTable(
  "users",
  {
    id: p.uuid("id").primaryKey(),

    role: p.text("role").notNull().default("user"),

    name: p.text("name").notNull(),

    email: p.text("email").notNull().unique(),
    emailVerified: p.boolean("email_verified").notNull().default(false),

    phone: p.text("phone").notNull().unique(),
    phoneVerified: p.boolean("phone_verified").notNull().default(false),

    banned: p.boolean("banned").notNull().default(false),
    banExpires: p.timestamp("ban_expires"),
    banReason: p.text("ban_reason"),

    createdAt: p.timestamp("created_at").notNull().defaultNow(),
    updatedAt: p
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: p.timestamp("deleted_at"),
  },
  (t) => [
    p.uniqueIndex("email_idx").on(t.email).where(sql`${t.deletedAt} IS NULL`),
    p.uniqueIndex("phone_idx").on(t.phone).where(sql`${t.deletedAt} IS NULL`),
    p.index("role_idx").on(t.role),
  ],
);
