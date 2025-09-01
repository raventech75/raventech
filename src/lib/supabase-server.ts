import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function supabaseServer() {
  const store = await cookies(); // Next 15

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // lit sb-access-token / sb-refresh-token
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // permet à @supabase/ssr de rafraîchir la session si besoin
          store.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          store.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  return supabase;
}