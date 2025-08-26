import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

function normalizeSupabaseUrl(raw?: string): string {
  if (!raw) throw new Error("Supabase URL env (NEXT_PUBLIC_SUPABASE_URL) is missing");
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const u = new URL(url);
    return u.toString().replace(/\/$/, "");
  } catch (e) {
    console.error("Invalid Supabase URL (client):", raw, e);
    throw new Error("Invalid Supabase URL; include full https:// origin");
  }
}

/**
 * Create a Supabase browser client.
 */
export function createClient() {
  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnon) throw new Error("Supabase anon key env (NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing");
  return createBrowserClient<Database>(supabaseUrl, supabaseAnon);
}

/* Provide a default export so either
   `import createClient from "..."`  OR
   `import { createClient } from "..."`  works. */
export default createClient;
