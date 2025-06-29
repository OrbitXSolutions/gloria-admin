import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

/**
 * Create a Supabase browser client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/* Provide a default export so either
   `import createClient from "..."`  OR
   `import { createClient } from "..."`  works. */
export default createClient;
