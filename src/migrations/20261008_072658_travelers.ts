import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "travelers_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "travelers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "travelers_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "travelers_id" integer;
  ALTER TABLE "travelers_sessions" ADD CONSTRAINT "travelers_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."travelers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "travelers_sessions_order_idx" ON "travelers_sessions" USING btree ("_order");
  CREATE INDEX "travelers_sessions_parent_id_idx" ON "travelers_sessions" USING btree ("_parent_id");
  CREATE INDEX "travelers_updated_at_idx" ON "travelers" USING btree ("updated_at");
  CREATE INDEX "travelers_created_at_idx" ON "travelers" USING btree ("created_at");
  CREATE UNIQUE INDEX "travelers_email_idx" ON "travelers" USING btree ("email");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_travelers_fk" FOREIGN KEY ("travelers_id") REFERENCES "public"."travelers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_travelers_fk" FOREIGN KEY ("travelers_id") REFERENCES "public"."travelers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_travelers_id_idx" ON "payload_locked_documents_rels" USING btree ("travelers_id");
  CREATE INDEX "payload_preferences_rels_travelers_id_idx" ON "payload_preferences_rels" USING btree ("travelers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "travelers_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "travelers" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "travelers_sessions" CASCADE;
  DROP TABLE "travelers" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_travelers_fk";
  
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_travelers_fk";
  
  DROP INDEX "payload_locked_documents_rels_travelers_id_idx";
  DROP INDEX "payload_preferences_rels_travelers_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "travelers_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "travelers_id";`)
}
