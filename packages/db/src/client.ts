import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
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
