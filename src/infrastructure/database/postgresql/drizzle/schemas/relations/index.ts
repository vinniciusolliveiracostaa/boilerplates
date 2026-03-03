import { defineRelations } from "drizzle-orm";
import { accounts } from "../auth/account/account.schema.js";
import { sessions } from "../auth/session/session.schema.js";
import { users } from "../user/user.schema.js";

export const relations = defineRelations(
	{ users, accounts, sessions },
	(r) => ({
		// User relations
		users: {
			// User has many accounts
			accounts: r.many.accounts({
				from: r.users.id,
				to: r.accounts.userId,
			}),

			// User has many sessions
			sessions: r.many.sessions({
				from: r.users.id,
				to: r.sessions.userId,
			}),
		},

		// Account relations
		accounts: {
			// Account belongs to a user
			user: r.one.users({
				from: r.accounts.userId,
				to: r.users.id,
			}),
		},

		// Session relations
		sessions: {
			// Session belongs to a user
			user: r.one.users({
				from: r.sessions.userId,
				to: r.users.id,
			}),
		},
	}),
);
