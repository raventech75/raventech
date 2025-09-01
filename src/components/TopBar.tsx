'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function TopBar() {
  const router = useRouter();
  const st = useAlbumStore();
  const userEmail = typeof window !== 'undefined'
    ? (localStorage.getItem('rt-last-email') || '')
    : '';

  async function handleLogout() {
    try {
      await supabaseBrowser.auth.signOut();
      await fetch('/api/auth/clear-cookie', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      router.replace('/sign-in?redirect=%2Feditor');
    }
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-cyan-500" />
        <div className="font-semibold text-slate-900">RavenTech — Éditeur</div>
        <div className="ml-4 text-xs text-slate-500">
          Page {st.currentIndex + 1} / {st.pages.length} — Taille {st.size.label}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => st.autoLayoutAuto()}
          title="Auto-layout"
        >
          Auto
        </button>
        <button
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => st.autoLayout(2)}
          title="Grille 2 colonnes"
        >
          2 colonnes
        </button>
        <button
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => window.dispatchEvent(new Event('raventech-preview'))}
          title="Aperçu plein écran"
        >
          Aperçu
        </button>

        <div className="mx-2 h-6 w-px bg-slate-200" />

        <span className="hidden sm:inline text-xs text-slate-500">{userEmail}</span>
        <button
          onClick={handleLogout}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
        >
          Se déconnecter
        </button>
      </div>
    </header>
  );
}