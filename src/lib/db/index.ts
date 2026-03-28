import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    // Dynamic imports to avoid top-level evaluation during build
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { neon } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/neon-http");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const schemaModule = require("./schema");
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema: schemaModule });
  }
  return _db!;
}
