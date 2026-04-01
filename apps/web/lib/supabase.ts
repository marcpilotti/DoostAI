import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/**
 * Server-side Supabase client with service role key.
 * Lazy-initialized to avoid crash when env vars are missing at build time.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
      if (!url || !key) {
        throw new Error("Supabase URL and service role key are required at runtime");
      }
      _supabase = createClient(url, key);
    }
    return (_supabase as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Safe query wrapper — returns null if table doesn't exist or query fails.
 */
export async function safeQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: { code?: string; message?: string } | null }>,
): Promise<T | null> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("Could not find")) {
        return null; // Table doesn't exist
      }
      console.error("[supabase] Query error:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("[supabase] Connection error:", err);
    return null;
  }
}
