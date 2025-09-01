// util serveur Supabase pour App Router (Next 15+)
// - cookies() peut être async en route handlers => on l'await
// - expose une fonction async supabaseServer()

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function supabaseServer() {
  const cookieStore = await cookies(); // ✅ Next 15: Promise<ReadonlyRequestCookies>

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL invalide ou manquante');
  }
  if (!anon) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY manquante');
  }

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {}
      },
    },
  });
}

export type SupabaseServerClient = Awaited<ReturnType<typeof supabaseServer>>;