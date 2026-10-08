import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import { Experiences } from "./collections/Experiences";
import { Partners } from "./collections/Partners";
import { Regions } from "./collections/Regions";
import { Travelers } from "./collections/Travelers";
import { Users } from "./collections/Users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Neon's host resolves to several IPv4 and IPv6 addresses, and Node gives each connect
// attempt only 250 ms by default. On a busy machine (e.g. during `next build`) every
// attempt can miss that window and the query fails with ETIMEDOUT. Allow 2 s per attempt.
net.setDefaultAutoSelectFamilyAttemptTimeout(2000);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: " · Safarinet admin" },
  },
  collections: [Regions, Partners, Experiences, Travelers, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL ?? "" },
    // Schema changes go through migrations (npm run migrate), never auto-push,
    // so dev and production Neon branches stay in step.
    push: false,
    migrationDir: path.resolve(dirname, "migrations"),
  }),
});
