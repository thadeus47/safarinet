import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import { Experiences } from "./collections/Experiences";
import { Partners } from "./collections/Partners";
import { Regions } from "./collections/Regions";
import { Users } from "./collections/Users";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: " · Safarinet admin" },
  },
  collections: [Regions, Partners, Experiences, Users],
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
