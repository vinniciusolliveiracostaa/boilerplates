ALTER TABLE "users" RENAME COLUMN "phone_number_verified" TO "phone_verified";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phone_key" UNIQUE("phone");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "accounts_provider_idx" ON "accounts" ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" ("email") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "phone_idx" ON "users" ("phone") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "role_idx" ON "users" ("role");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" ("identifier");