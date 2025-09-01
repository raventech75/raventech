// src/lib/supabase-server.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Crée un client Supabase côté serveur en lisant manuellement
 * les cookies 'sb-access-token' & 'sb-refresh-token' et en
 * poussant le JWT dans Authorization: Bearer <token>.
 */
export async function supabaseServer() {
  const jar = await cookies();

  // Lis les cookies (HttpOnly)
  const access = jar.get("sb-access-token")?.value;
  const refresh = jar.get("sb-refresh-token")?.value;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Fournit un adapter cookies à @supabase/ssr (pour refresh éventuel)
      cookies: {
        get(name: string) {
          return jar.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          jar.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          jar.set(name, "", { ...options, maxAge: 0 });
        },
      },
      // Injecte Authorization si on a le JWT
      global: access
        ? {
            headers: {
              Authorization: `Bearer ${access}`,
            },
          }
        : undefined,
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    }
  );

  return supabase;
}