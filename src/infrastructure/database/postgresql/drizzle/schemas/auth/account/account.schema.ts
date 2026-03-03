import * as p from "drizzle-orm/pg-core";
import { users } from "../../user/user.schema.js";

export const accounts = p.pgTable("accounts", {
	id: p.uuid().primaryKey(),
	providerId: p.text("provider_id").notNull(),
	accountId: p.text("account_id").notNull(),
	userId: p
		.uuid("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	accessToken: p.text("access_token"),
	refreshToken: p.text("refresh_token"),
	idToken: p.text("id_token"),
	/**
	 * Access token expires at
	 */
	accessTokenExpiresAt: p.timestamp("access_token_expires_at"),
	/**
	 * Refresh token expires at
	 */
	refreshTokenExpiresAt: p.timestamp("refresh_token_expires_at"),
	/**
	 * The scopes that the user has authorized
	 */
	scope: p.text("scope"),
	/**
	 * Password is only stored in the credential provider
	 */
	password: p.text("password"),

	createdAt: p.timestamp("created_at").notNull().defaultNow(),
	updatedAt: p.timestamp("updated_at").notNull().defaultNow(),
});
