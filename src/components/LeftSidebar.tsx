'use client';

import { useAlbumStore, ALBUM_SIZES } from '@/store/useAlbumStore';

export default function LeftSidebar() {
  const st = useAlbumStore();

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Cartouche */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Taille de l’album
        </div>
        <select
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          value={st.size.label}
          onChange={(e) => {
            const s = ALBUM_SIZES.find((x) => x.label === e.target.value)!;
            st.setSize(s);
            // recalcule le fit après changement format
            setTimeout(() => window.dispatchEvent(new CustomEvent('raventech-fit')), 0);
          }}
        >
          {ALBUM_SIZES.map((s) => (
            <option key={s.label} value={s.label}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span>Zoom</span>
          <div className="flex items-center gap-2">
            <button
              className="rounded border border-slate-200 px-2 py-1"
              onClick={() => st.setZoom(Math.max(0.1, st.zoom - 0.05))}
            >
              –
            </button>
            <span className="w-12 text-center tabular-nums">{Math.round(st.zoom * 100)}%</span>
            <button
              className="rounded border border-slate-200 px-2 py-1"
              onClick={() => st.setZoom(Math.min(3, st.zoom + 0.05))}
            >
              +
            </button>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('raventech-fit'))}
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Adapter
        </button>
      </div>

      {/* Liste des pages (vignettes) */}
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pages ({st.pages.length})
          </div>
          <div className="flex gap-1">
            <button
              className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
              onClick={() => st.addPage()}
            >
              +
            </button>
            <button
              className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
              onClick={() => st.removePage(st.currentIndex)}
            >
              −
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {st.pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => st.goTo(i)}
              className={`w-full rounded-lg border p-2 text-left ${
                i === st.currentIndex ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-medium">Page {i + 1}</div>
              <div className="mt-1 h-16 w-full rounded border border-dashed border-slate-300 bg-slate-50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}