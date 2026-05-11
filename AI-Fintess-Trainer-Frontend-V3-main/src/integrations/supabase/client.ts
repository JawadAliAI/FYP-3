// client.ts — FINAL VERSION
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn("Missing Supabase env vars. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY");
}

const globalForSupabase = globalThis as unknown as {
  __FYP_SUPABASE_CLIENT__?: SupabaseClient<Database>;
};

/** One client per browser tab — avoids duplicate GoTrueClient / storage races. */
export const supabase: SupabaseClient<Database> =
  globalForSupabase.__FYP_SUPABASE_CLIENT__ ??
  (globalForSupabase.__FYP_SUPABASE_CLIENT__ = createClient<Database>(
    SUPABASE_URL as string,
    SUPABASE_PUBLISHABLE_KEY as string,
    {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "X-Client-Info": "ai-fitness-trainer",
        },
      },
    },
  ));
