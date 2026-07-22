import { createClient } from "@supabase/supabase-js";

// Retrieve Supabase URL and Anon/Publishable Key from environment variables
const supabaseUrl = 
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (typeof process !== "undefined" && process.env?.SUPABASE_URL) ||
  (typeof window !== "undefined" && (window as any).env?.SUPABASE_URL) ||
  "https://qobtybbklcqmdwsrwito.supabase.co";

const supabaseAnonKey = 
  (import.meta as any).env?.VITE_SUPABASE_SECRET_KEY ||
  (typeof process !== "undefined" && process.env?.SUPABASE_SECRET_KEY) ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== "undefined" && (process.env?.SUPABASE_PUBLISHABLE_KEY || process.env?.SUPABASE_ANON_KEY)) ||
  (typeof window !== "undefined" && ((window as any).env?.SUPABASE_PUBLISHABLE_KEY || (window as any).env?.SUPABASE_ANON_KEY)) ||
  "";

// Initialize the standard Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
