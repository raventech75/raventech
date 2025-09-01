'use client';

import { useState } from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

type Props = {
  /** Adapter la vue du canvas à l’écran (fourni par la page editor). */
  onFit?: () => void;
};

/** Déclare les helpers exposés par EditorCanvas pour éviter les erreurs TS. */
declare global {
  interface Window {
    ravenCaptureOne?: () => Promise<{ dataUrl: string; pagePx: { w: number; h: number } }>;
    ravenCaptureAll?: () => Promise<Array<{ dataUrl: string; pagePx: { w: number; h: number } }>>;
  }
}

export default function Toolbar({ onFit }: Props) {
  const st = useAlbumStore();
  const [busy, setBusy] = useState<false | 'one' | 'all'>(false);

  function doFit() {
    if (onFit) return onFit();
    // Fallback: laisse l’EditorCanvas s’ajuster via un event global
    window.dispatchEvent(new Event('raventech-fit'));
  }

  function preview() {
    window.dispatchEvent(new Event('raventech-preview'));
  }

  function logout() {
    // supprime les cookies côté serveur puis redirige
    window.location.href = '/api/auth/clear-cookie';
  }

  async function exportOne() {
    try {
      setBusy('one');

      const cap = await window.ravenCaptureOne?.();
      if (!cap?.dataUrl) throw new Error('Capture page échouée');

      const payload = {
        images: [cap.dataUrl],
        pagePx: cap.pagePx,
        dpi: st.dpi,
        // cropMarks supprimé car non présent dans le store
      };

      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Export PDF (page) : réponse invalide');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'raventech-page.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function exportAll() {
    try {
      setBusy('all');

      const caps = await window.ravenCaptureAll?.();
      if (!caps?.length) throw new Error('Aucune capture disponible');

      const payload = {
        images: caps.map((c) => c.dataUrl),
        pagePx: caps[0].pagePx,
        dpi: st.dpi,
        // cropMarks supprimé car non présent dans le store
      };

      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Export PDF (album) : réponse invalide');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'raventech-album.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur">
      {/* Bloc gauche : outils & repères */}
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={doFit}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
          title="Adapter la page à l’écran"
        >
          Adapter à l’écran
        </button>

        <button
          type="button"
          onClick={preview}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
          title="Aperçu rapide"
        >
          Aperçu
        </button>

        <div className="h-5 w-px bg-slate-300" />

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={st.showGuides}
            onChange={() => st.toggleGuides()}
          />
          <span>Repères</span>
        </label>

        <label className="inline-flex items-center gap-2">
          <span>Bleed</span>
          <input
            type="number"
            min={0}
            step={1}
            value={st.bleedMm}
            onChange={(e) => st.setBleedMm(parseInt(e.target.value || '0', 10))}
            className="w-16 rounded border border-slate-300 px-2 py-1"
          />
          <span>mm</span>
        </label>
      </div>

      {/* Bloc droit : export + logout */}
      <div className="flex items-center gap-2">
        <button
          onClick={exportOne}
          disabled={!!busy}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
        >
          {busy === 'one' ? 'Export…' : 'Exporter la page'}
        </button>
        <button
          onClick={exportAll}
          disabled={!!busy}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
        >
          {busy === 'all' ? 'Export…' : 'Exporter tout'}
        </button>

        <div className="h-5 w-px bg-slate-300" />

        <button
          onClick={logout}
          className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100"
          title="Se déconnecter"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}