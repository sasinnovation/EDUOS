import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = 
  (typeof process !== "undefined" && process.env?.SUPABASE_URL) ||
  (typeof window !== "undefined" && (window as any).env?.SUPABASE_URL) ||
  "https://qobtybbklcqmdwsrwito.supabase.co";

const supabaseKey = 
  (typeof process !== "undefined" && process.env?.SUPABASE_PUBLISHABLE_KEY) ||
  (typeof window !== "undefined" && (window as any).env?.SUPABASE_PUBLISHABLE_KEY) ||
  "";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
