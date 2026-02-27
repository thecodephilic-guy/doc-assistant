CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"filename" text NOT NULL,
	"originalName" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "documents" USING btree ("userId");