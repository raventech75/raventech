'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/browser';

// (optionnel) forcer dynamique si tu préfères
// export const dynamic = 'force-dynamic';

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" stroke="url(#rg)" strokeWidth="4" />
      <path
        d="M20 42c8-6 13-6 24 0M20 22l8 8-8 8m24-16l-8 8 8 8"
        stroke="url(#rg)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Composant enfant qui utilise useSearchParams, rendu dans un <Suspense> */
function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPwd, setShowPwd] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Merci d'entrer un email valide.");
      return;
    }
    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
  // 1) login
  const { error: err } = await supabaseBrowser.auth.signInWithPassword({ email, password });
  if (err) throw err;

  // 2) récupérer la session
  const sess = await supabaseBrowser.auth.getSession();
  const at = sess.data.session?.access_token;
  const rt = sess.data.session?.refresh_token;

  // 3) synchroniser les cookies httpOnly côté serveur (pour middleware/SSR)
  if (at && rt) {
    await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ access_token: at, refresh_token: rt }),
    });
  }

  // 4) redirection
  const redirect = params.get('redirect') || '/dashboard';
  await new Promise((r) => setTimeout(r, 200));
  router.replace(redirect);
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  setError(msg || 'Une erreur est survenue. Réessayez.');
} finally {
  setLoading(false);
}
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-fuchsia-100 via-indigo-100 to-cyan-100">
      {/* Colonne gauche (accroche) */}
      <div className="hidden lg:flex items-center justify-center p-12">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-4">
            <LogoMark className="h-12 w-12" />
            <div>
              <p className="text-sm tracking-wider uppercase text-slate-600">Bienvenue sur</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">RavenTech Albums</h1>
            </div>
          </div>
          <p className="text-slate-700 text-lg leading-relaxed">
            L&apos;outil moderne et coloré pour mettre en page vos albums photo comme sur{' '}
            <span className="font-semibold">Pixellu</span> ou <span className="font-semibold">Fundy</span> — avec un
            éditeur fluide, des templates élégants, et des exports impeccables.
          </p>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-fuchsia-500" /> Éditeur drag-and-drop
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" /> Templates mariage, bébé, famille…
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" /> Export PDF haute résolution
            </li>
          </ul>
        </div>
      </div>

      {/* Colonne droite (formulaire) */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <LogoMark className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Se connecter</h2>
              <p className="text-sm text-slate-600">
                à votre compte <span className="font-medium">RavenTech</span>
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <Link href="#" className="text-sm font-medium text-indigo-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPwd ? (
                    // Eye-off
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                        d="m3 3 18 18M10.584 10.587a2 2 0 1 0 2.828 2.828M16.681 16.68C15.276 17.532 13.686 18 12 18 7.5 18 3.863 15.682 2 12c.676-1.278 1.697-2.4 2.96-3.28m3.296-1.776C9.144 6.314 10.527 6 12 6c4.5 0 8.137 2.318 10 6-.553 1.045-1.318 1.99-2.26 2.786"
                      />
                    </svg>
                  ) : (
                    // Eye
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.75"
                        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                      />
                      <circle cx="12" cy="12" r="3" strokeWidth="1.75" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="text-sm text-slate-700">Se souvenir de moi</span>
              </label>
              <Link href="/sign-up" className="text-sm font-medium text-fuchsia-600 hover:underline">
                Créer un compte
              </Link>
            </div>

            {error && (
              <div role="alert" aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full rounded-xl bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>

            <div className="relative py-2 text-center">
              <span className="relative z-10 bg-white/80 px-3 text-xs uppercase tracking-wider text-slate-500">ou</span>
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200">
                {/* Google */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.681 31.978 29.223 35 24 35c-6.627 0-12-5.373-12-12S17.373 11 24 11c3.059 0 5.843 1.154 7.961 3.039l5.657-5.657C34.164 5.053 29.327 3 24 3 12.954 3 4 11.954 4 23s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.4 16.108 18.828 13 24 13c3.059 0 5.843 1.154 7.961 3.039l5.657-5.657C34.164 5.053 29.327 3 24 3 16.318 3 9.656 7.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 43c5.166 0 9.86-1.977 13.409-5.197l-6.191-5.238C29.24 34.976 26.778 36 24 36c-5.202 0-9.647-3.001-11.589-7.356l-6.511 5.02C9.232 40.541 16.03 43 24 43z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303A11.996 11.996 0 0 1 24 35c-6.627 0-12-5.373-12-12S17.373 11 24 11c3.059 0 5.843 1.154 7.961 3.039l5.657-5.657C34.164 5.053 29.327 3 24 3 12.954 3 4 11.954 4 23s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z" />
                </svg>
                Google
              </button>
              <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200">
                {/* Apple */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M16.365 1.43c.084 1.01-.3 2.01-.98 2.77-.65.77-1.74 1.36-2.79 1.28-.095-1.001.33-2.03 1.01-2.79.7-.76 1.9-1.32 2.76-1.26zM21 17.27c-.46 1.12-.67 1.62-1.26 2.62-.82 1.33-1.99 2.98-3.46 2.99-1.29.01-1.63-.86-3.4-.86-1.78 0-2.15.85-3.44.87-1.46.03-2.57-1.44-3.4-2.77-2.34-3.59-2.59-7.81-1.15-10.04.98-1.54 2.53-2.46 4.27-2.49 1.33-.03 2.59.9 3.4.9.8 0 2.34-1.12 3.94-.96.67.03 2.57.27 3.79 2.04-3.33 1.82-2.79 6.59.81 7.7z" />
                </svg>
                Apple
              </button>
            </div>

            <p className="text-center text-xs text-slate-500">
              En continuant, vous acceptez nos{' '}
              <Link href="#" className="underline underline-offset-2 hover:text-slate-700">Conditions</Link> et notre{' '}
              <Link href="#" className="underline underline-offset-2 hover:text-slate-700">Politique de confidentialité</Link>.
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="col-span-full py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} RavenTech — Tous droits réservés
      </div>
    </div>
  );
}

/** Page wrapper avec Suspense (requis quand on utilise useSearchParams en client) */
export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center">Chargement…</div>}>
      <SignInForm />
    </Suspense>
  );
}