'use client';

import React from 'react';
import { useAlbumStore, ALBUM_FORMATS } from '@/store/useAlbumStore';
import BackgroundPanel from './BackgroundPanel';

export default function Sidebar() {
  const st = useAlbumStore();
  const [collapsed, setCollapsed] = React.useState(false);
  const [exportSpec, setExportSpec] = React.useState<string>('');

  // index du format courant (taille OUVERTE)
  const currentFmtIndex = Math.max(
    0,
    ALBUM_FORMATS.findIndex((f) => f.open.w === st.size.w && f.open.h === st.size.h)
  );

  const onChangeFormat = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    const fmt = ALBUM_FORMATS[idx];
    if (!fmt) return;
    st.setSize({ w: fmt.open.w, h: fmt.open.h });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('album:zoom-fit'));
      window.dispatchEvent(new CustomEvent('album:size-changed'));
    }, 0);
  };

  const setPagesCount = (n: number) => {
    const target = Math.max(2, Math.min(25, n));
    st.setPages((prev) => resizePages(prev, target));
    if (st.currentPageIndex > target - 1) st.setCurrentPage(target - 1);
  };

  const onChangeDpi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(72, Math.min(1200, parseInt(e.target.value || '300', 10)));
    st.setDpi(val);
  };

  // Export
  function parsePagesSpec(spec: string): number[] {
    const cleaned = spec.replace(/\s+/g, '');
    if (!cleaned) return [];
    const out = new Set<number>();
    for (const token of cleaned.split(',')) {
      if (!token) continue;
      if (token.includes('-')) {
        const [a, b] = token.split('-').map((v) => parseInt(v, 10));
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        const start = Math.max(1, Math.min(a, b));
        const end = Math.min(st.pages.length, Math.max(a, b));
        for (let n = start; n <= end; n++) out.add(n - 1);
      } else {
        const n = parseInt(token, 10);
        if (Number.isFinite(n) && n >= 1 && n <= st.pages.length) out.add(n - 1);
      }
    }
    return [...out].sort((x, y) => x - y);
  }
  const exportCurrent = () => st.exportJpeg({ pages: [st.currentPageIndex] });
  const exportAll = () => st.exportJpeg({ all: true });
  const exportList = () => {
    const list = parsePagesSpec(exportSpec);
    if (!list.length) return st.exportJpeg({ pages: [st.currentPageIndex] });
    st.exportJpeg({ pages: list });
  };

  return (
    <aside
      className={`
        relative z-[1] shrink-0 border-r border-slate-200 bg-white
        h-screen sticky top-0 overflow-y-auto
        px-3 sm:px-4
      `}
      style={{
        // largeur fluide : jamais trop étroit ni trop large
        width: collapsed ? 64 : undefined,
        minWidth: collapsed ? 64 : undefined,
        maxWidth: collapsed ? 64 : undefined,
        // quand non replié : clamp responsive
        ...(collapsed
          ? {}
          : { width: 'clamp(260px, 22vw, 360px)', minWidth: 260, maxWidth: 360 }),
      }}
    >
      {/* Header + toggle */}
      <div className="py-3 flex items-center gap-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="h-8 w-8 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
          title={collapsed ? 'Déplier' : 'Replier'}
        >
          {collapsed ? '›' : '‹'}
        </button>
        {!collapsed && (
          <div className="text-sm font-semibold text-slate-700">Réglages</div>
        )}
        <div className="ml-auto text-[12px] text-slate-500 px-2">
          {Math.round(st.zoom * 100)}%
        </div>
      </div>

      {/* Contenu : important -> min-w-0 pour éviter la coupe visuelle */}
      <div className={`${collapsed ? '' : 'space-y-6'} min-w-0`}>
        {/* Format */}
        {!collapsed && (
          <section className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Format de l’album</h3>
            <div className="min-w-0">
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={currentFmtIndex}
                onChange={onChangeFormat}
              >
                {ALBUM_FORMATS.map((f, i) => (
                  <option key={f.label} value={i}>
                    {f.label} → ouvert {f.open.w}×{f.open.h} cm
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Les tailles indiquées sont <strong>“fermé”</strong>. Le canvas est en <strong>“ouvert”</strong> (largeur ×2).
            </p>
          </section>
        )}

        {/* Résolution */}
        {!collapsed && (
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Résolution d’export</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={72}
                max={1200}
                step={1}
                className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                value={st.dpi}
                onChange={onChangeDpi}
              />
              <span className="text-sm text-slate-600">dpi</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Utilisé par l’export JPEG (300 dpi recommandé pour l’impression).
            </p>
          </section>
        )}

        {/* Fond de page */}
        {!collapsed && <BackgroundPanel />}

        {/* Pages – incrémenteur compact */}
        <section>
          {!collapsed && (
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Nombre de pages <span className="text-slate-500">(2–25)</span>
            </h3>
          )}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2`}>
            <button
              onClick={() => setPagesCount(st.pages.length - 1)}
              className="h-8 w-8 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Retirer une page"
            >
              −
            </button>
            <div className="px-3 py-1.5 rounded-full border border-slate-300 text-sm text-slate-700 min-w-[64px] text-center">
              {st.pages.length}
            </div>
            <button
              onClick={() => setPagesCount(st.pages.length + 1)}
              className="h-8 w-8 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
              title="Ajouter une page"
            >
              +
            </button>
          </div>
          {!collapsed && (
            <p className="text-sm mt-1 text-slate-600">
              {st.pages.length} pages • {Math.ceil(st.pages.length / 2)} doubles-pages
            </p>
          )}
        </section>

        {/* Export */}
        <section>
          {!collapsed && (
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Export JPEG</h3>
          )}
          <div className={`grid ${collapsed ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
            <button
              onClick={() => st.exportJpeg({ pages: [st.currentPageIndex] })}
              className="h-8 px-3 rounded-md border border-slate-300 text-[12px] text-slate-700 bg-white hover:bg-slate-50"
              title="Exporter la page courante"
            >
              {collapsed ? 'Page' : 'Exporter la page'}
            </button>
            <button
              onClick={() => st.exportJpeg({ all: true })}
              className="h-8 px-3 rounded-md border border-slate-300 text-[12px] text-slate-700 bg-white hover:bg-slate-50"
              title="Exporter tout l’album"
            >
              {collapsed ? 'Tout' : 'Exporter tout'}
            </button>
            {!collapsed && (
              <>
                <input
                  value={exportSpec}
                  onChange={(e) => setExportSpec(e.target.value)}
                  placeholder="Ex: 1-3,5,8"
                  className="col-span-1 h-8 rounded-md border border-slate-300 px-2 text-[12px]"
                  title="Plage de pages à exporter (ex: 1-3,5)"
                />
                <button
                  onClick={() => {
                    const list = parsePagesSpec(exportSpec);
                    if (!list.length) return st.exportJpeg({ pages: [st.currentPageIndex] });
                    st.exportJpeg({ pages: list });
                  }}
                  className="h-8 px-3 rounded-md border border-slate-300 text-[12px] text-slate-700 bg-white hover:bg-slate-50"
                >
                  Exporter la sélection
                </button>
              </>
            )}
          </div>
        </section>

        {/* Infos */}
        {!collapsed && (
          <section className="text-xs text-slate-500 pb-4">
            <p>Page actuelle : {st.currentPageIndex + 1} / {st.pages.length}</p>
            <p>Taille (ouvert) : {st.size.w}×{st.size.h} cm — Zoom {Math.round(st.zoom * 100)}%</p>
          </section>
        )}
      </div>
    </aside>
  );
}

/* -------- Helpers -------- */
import type { Page } from '@/store/useAlbumStore';

function resizePages(prev: Page[], targetCount: number): Page[] {
  const cur = [...prev].sort((a, b) => a.index - b.index);
  if (targetCount === cur.length) return cur.map((p, i) => ({ ...p, index: i }));
  if (targetCount < cur.length) return cur.slice(0, targetCount).map((p, i) => ({ ...p, index: i }));

  const toAdd = targetCount - cur.length;
  const base = cur.length;
  const added: Page[] = Array.from({ length: toAdd }, (_, k) => ({
    id: `p${base + k}`,
    index: base + k,
    items: [],
    background: {
      kind: 'none',
      solid: { color: '#FFFFFF' },
      linear: { from: '#FFFFFF', to: '#F8FAFC', angle: 90 },
      radial: { inner: '#FFFFFF', outer: '#F1F5F9', shape: 'ellipse' },
      image: { fit: 'cover', opacity: 1, scale: 1, offsetX: 0, offsetY: 0 },
      vignette: { enabled: false, strength: 0.25 },
      texture: { type: 'none', opacity: 0.3 },
      noise: { enabled: false, amount: 0.15, opacity: 0.15, monochrome: true },
      text: { content: '', color: '#000000', opacity: 0.08, sizePct: 40, rotation: -20, font: 'serif' },
    },
  }));
  return cur.concat(added).map((p, i) => ({ ...p, index: i }));
}