"use server";
import { createServerClient } from "@supabase/ssr";
import { Database } from "../types/database.types";
import { cookies } from "next/headers";

function normalizeSupabaseUrl(raw?: string): string {
  if (!raw) throw new Error("Supabase URL env (NEXT_PUBLIC_SUPABASE_URL) is missing");
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    // Auto-prefix https if scheme omitted (common mistake in dev)
    url = `https://${url}`;
  }
  try {
    // Validate
    const u = new URL(url);
    return u.toString().replace(/\/$/, "");
  } catch (e) {
    console.error("Invalid Supabase URL provided:", raw, e);
    throw new Error("Invalid Supabase URL. Please include full origin e.g. https://xyz.supabase.co");
  }
}

export async function createSsrClient() {
  const cookieStore = await cookies()

  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnon) throw new Error("Supabase anon key env (NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing");

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnon,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
