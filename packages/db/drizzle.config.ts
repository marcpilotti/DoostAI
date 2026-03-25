import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: "../../.env.local" });

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Use DIRECT_URL for migrations — PgBouncer doesn't support DDL
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
