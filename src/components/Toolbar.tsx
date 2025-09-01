'use client';

import { useState } from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

type Props = {
  /** Adapter la vue du canvas à l’écran (fourni par la page editor). */
  onFit?: () => void;
};

export default function Toolbar({ onFit }: Props) {
  const st = useAlbumStore();
  const [busy, setBusy] = useState<false | 'one' | 'all'>(false);

  async function exportOne() {
    try {
      setBusy('one');
      // exposé par EditorCanvas via window.ravenCaptureOne
      const cap: { dataUrl: string; pagePx: { w: number; h: number } } | undefined =
        (window as any)?.ravenCaptureOne ? await (window as any).ravenCaptureOne() : undefined;
      if (!cap?.dataUrl) throw new Error('Capture page échouée');

      const payload = {
        images: [cap.dataUrl],
        pagePx: cap.pagePx,
        dpi: st.dpi,
        cropMarks: st.cropMarks,
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
      // exposé par EditorCanvas via window.ravenCaptureAll
      const caps:
        | { dataUrl: string; pagePx: { w: number; h: number } }[]
        | undefined = (window as any)?.ravenCaptureAll
        ? await (window as any).ravenCaptureAll()
        : undefined;

      if (!caps?.length) throw new Error('Aucune capture disponible');

      const payload = {
        images: caps.map((c) => c.dataUrl),
        pagePx: caps[0].pagePx,
        dpi: st.dpi,
        cropMarks: st.cropMarks,
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
          onClick={onFit}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
          title="Adapter la page à l’écran"
        >
          Adapter à l’écran
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
          <input
            type="checkbox"
            checked={st.cropMarks}
            onChange={(e) => st.setCropMarks(e.target.checked)}
          />
          <span>Traits de coupe</span>
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

      {/* Bloc droit : export */}
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
      </div>
    </div>
  );
}