'use client';

import Link from 'next/link';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function Toolbar({ onFit }: { onFit?: () => void }) {
  const st = useAlbumStore();

  const logout = async () => {
    try {
      await fetch('/api/auth/clear-cookie', { method: 'POST' });
      window.location.href = '/sign-in';
    } catch {
      // ignore
    }
  };

  return (
    <div className="h-14 w-full border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-cyan-500" />
            <span className="font-semibold">RavenTech</span>
          </Link>
          <div className="ml-4 flex items-center gap-2 text-sm">
            <button
              onClick={onFit}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
            >
              Adapter à l’écran
            </button>
            <button
              onClick={() => st.toggleGrid()}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
            >
              Grille {st.showGrid ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => st.toggleGuides()}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
            >
              Repères {st.showGuides ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => st.toggleSnap()}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
            >
              Snap {st.snap ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={logout}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}