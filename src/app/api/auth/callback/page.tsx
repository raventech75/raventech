'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/Browser';

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const code = params.get('code');
        if (code) {
          const { data, error } = await supabaseBrowser.auth.exchangeCodeForSession(code);
          if (error) throw error;

          const at = data.session?.access_token;
          const rt = data.session?.refresh_token;
          if (at && rt) {
            await fetch('/api/auth/set-cookie', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ access_token: at, refresh_token: rt }),
            });
          }
        } else {
          // fallback (magic link hash)
          const sess = await supabaseBrowser.auth.getSession();
          const at = sess.data.session?.access_token;
          const rt = sess.data.session?.refresh_token;
          if (at && rt) {
            await fetch('/api/auth/set-cookie', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ access_token: at, refresh_token: rt }),
            });
          }
        }

        // 👇 respecte le redirect transmis (par défaut /editor)
        const dest = params.get('redirect') || '/editor';
        router.replace(dest);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [params, router]);

  return <div className="min-h-screen grid place-items-center">{err ?? 'Connexion en cours…'}</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center">Chargement…</div>}>
      <Inner />
    </Suspense>
  );
}