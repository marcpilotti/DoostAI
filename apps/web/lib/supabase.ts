import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Server-side Supabase client with service role key.
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

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
