import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.SUPABASE_URL || "https://qobtybbklcqmdwsrwito.supabase.co";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || "";

export const createClient = (req?: any, res?: any) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          if (!req || !req.cookies) return [];
          return Object.entries(req.cookies).map(([name, value]) => ({
            name,
            value: value as string,
          }));
        },
        setAll(cookiesToSet) {
          if (!res) return;
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookie(name, value, options);
            });
          } catch {
            // Ignore if setting is not possible
          }
        },
      },
    },
  );
};
export default createClient;
