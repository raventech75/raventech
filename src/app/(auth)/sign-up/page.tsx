'use client';

import React from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/browser';

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
      <path d="M20 42c8-6 13-6 24 0M20 22l8 8-8 8m24-16l-8 8 8 8" stroke="url(#rg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SignUpPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

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
      const { error: err } = await supabaseBrowser.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
          data: { full_name: name },
        },
      });
      if (err) throw err;
      setInfo('Inscription réussie. Vérifiez votre email pour confirmer votre compte.');
   } catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  setError(msg || "Une erreur est survenue. Réessayez.");}

     finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-fuchsia-100 via-indigo-100 to-cyan-100">
      <div className="hidden lg:flex items-center justify-center p-12">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-4">
            <LogoMark className="h-12 w-12" />
            <div>
              <p className="text-sm tracking-wider uppercase text-slate-600">Rejoindre</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">RavenTech Albums</h1>
            </div>
          </div>
          <p className="text-slate-700 text-lg leading-relaxed">
            Créez votre compte pour commencer vos maquettes d'albums.
          </p>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-fuchsia-500" /> Drag‑and‑drop</li>
            <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" /> Templates pros</li>
            <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" /> Export haute résolution</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <LogoMark className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Créer un compte</h2>
              <p className="text-sm text-slate-600">pour <span className="font-medium">RavenTech</span></p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nom complet</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Adresse e‑mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-200" />
            </div>

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {info && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</div>}

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-60">
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>

            <p className="text-center text-sm text-slate-600">Déjà inscrit ? <Link href="/sign-in" className="font-medium text-indigo-600 hover:underline">Se connecter</Link></p>
          </form>
        </div>
      </div>

      <div className="col-span-full py-6 text-center text-xs text-slate-600">© {new Date().getFullYear()} RavenTech — Tous droits réservés</div>
    </div>
  );
}