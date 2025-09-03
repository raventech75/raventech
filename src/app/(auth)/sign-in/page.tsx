'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/** Récupère un client Supabase depuis '@/lib/supabase/browser'
 *  - supporte: export const supabaseBrowser = () => client
 *  - supporte: export default () => client
 *  - supporte: export const supabase = client / export const client = client
 */
async function getSupabaseClient(): Promise<any> {
  const mod: any = await import('@/lib/supabase/browser');
  const candidate =
    mod.supabaseBrowser ??
    mod.default ??
    mod.supabase ??
    mod.client ??
    mod.createClient; // au cas où

  if (!candidate) {
    throw new Error('Supabase client factory not found in "@/lib/supabase/browser".');
  }
  // si c’est une fonction, on l’appelle; sinon on suppose que c’est déjà le client
  return typeof candidate === 'function' ? candidate() : candidate;
}

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="56" height="48" rx="12" fill="url(#rg)" />
      <path d="M20 38l8-10 8 8 8-10" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignInFormInner() {
  const router = useRouter();
  const qp = useSearchParams();

  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const redirect = qp.get('redirect') || '/';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      router.replace(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Fond pleine viewport indépendant du <body> */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-fuchsia-100 via-indigo-100 to-cyan-100" />

      <div className="min-h-dvh grid grid-rows-[1fr_auto] lg:grid-cols-2">
        {/* Colonne gauche */}
        <div className="hidden lg:flex items-center justify-center p-12">
          <div className="max-w-md space-y-6">
            <div className="flex items-center gap-3">
              <LogoMark className="h-8 w-8" />
              <div className="text-slate-900">
                <div className="text-xs uppercase tracking-wide text-slate-600">Bienvenue sur</div>
                <div className="text-2xl font-bold">RavenTech Albums</div>
              </div>
            </div>
            <p className="text-slate-700">
              L&apos;outil moderne et coloré pour mettre en page vos albums photo comme sur <strong>Pixellu</strong> ou{' '}
              <strong>Fundy</strong> — avec un éditeur fluide, des templates élégants, et des exports impeccables.
            </p>
            <ul className="text-slate-700 space-y-1 text-sm">
              <li>• Éditeur drag-and-drop</li>
              <li>• Templates mariage, bébé, famille…</li>
              <li>• Export PDF haute résolution</li>
            </ul>
          </div>
        </div>

        {/* Colonne droite (formulaire) */}
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-6 shadow">
            <div className="mb-4 flex items-center gap-2">
              <LogoMark className="h-6 w-6" />
              <div className="text-slate-900 font-semibold">Se connecter</div>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <label className="block">
                <div className="mb-1 text-xs text-slate-600">Adresse e-mail</div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="vous@exemple.com"
                />
              </label>

              <label className="block">
                <div className="mb-1 text-xs text-slate-600">Mot de passe</div>
                <input
                  type="password"
                  required
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="••••••••"
                />
              </label>

              {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" className="h-4 w-4" />
                  Se souvenir de moi
                </label>
                <Link href="/reset" className="text-xs text-indigo-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                disabled={loading}
                className="w-full rounded-md bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400 px-4 py-2.5 font-medium text-white shadow hover:brightness-105 disabled:opacity-60"
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>

              <div className="relative my-2 text-center text-xs text-slate-500">
                <span className="px-2 bg-white">OU</span>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:shadow">
                  Google
                </button>
                <button type="button" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:shadow">
                  Apple
                </button>
              </div>

              <div className="text-xs text-slate-600">
                En continuant, vous acceptez nos{' '}
                <Link href="/terms" className="text-indigo-600 hover:underline">
                  Conditions
                </Link>{' '}
                et notre{' '}
                <Link href="/privacy" className="text-indigo-600 hover:underline">
                  Politique de confidentialité
                </Link>
                .
              </div>

              <div className="text-xs text-slate-700">
                Pas de compte ?{' '}
                <Link href="/sign-up" className="text-indigo-600 hover:underline">
                  Créer un compte
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="col-span-full py-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} RavenTech — Tous droits réservés
        </div>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 grid place-items-center">Chargement…</div>}>
      <SignInFormInner />
    </Suspense>
  );
}