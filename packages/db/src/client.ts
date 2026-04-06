import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";

import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

let _db: Database | undefined;

export function getDb(): Database {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const connection = postgres(url, {
      prepare: false, // required for Supabase connection pooling (PgBouncer)
    });
    _db = drizzle(connection, { schema });
  }
  return _db;
}

// Lazy proxy — behaves like the db instance but defers connection until first use
export const db: Database = new Proxy({} as Database, {
  get(_, prop) {
    const instance = getDb();
    const value = instance[prop as keyof Database];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

/**
 * Set the current org context for Supabase RLS policies.
 * Uses `set_config` with `is_local = true` so the value is transaction-scoped.
 * Call this before org-scoped Drizzle queries in API routes / server actions.
 */
export async function setOrgContext(orgId: string): Promise<void> {
  await getDb().execute(sql`SELECT set_config('app.current_org_id', ${orgId}, true)`);
}
