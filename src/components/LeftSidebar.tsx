'use client';

import React from 'react';
import { ALBUM_SIZES, useAlbumStore } from '@/store/useAlbumStore';

export default function LeftSidebar() {
  const st = useAlbumStore();

  async function handleExportPDF() {
    try {
      // construit un payload simple pour la route export-pdf
      const pagePx = {
        w: st.cmToPx(st.size.w * 2),
        h: st.cmToPx(st.size.h),
      };

      const pages = st.pages.map((p) => {
        const images = p.items
          .filter((i: any) => i.kind === 'photo')
          .map((i: any) => {
            const a = st.assets.find((x) => x.id === i.assetId);
            return {
              url: a?.url || '',
              x: i.x,
              y: i.y,
              w: i.width,
              h: i.height,
              rotation: i.rotation || 0,
              opacity: i.opacity ?? 1,
            };
          });

        const texts = p.items
          .filter((i: any) => i.kind === 'text')
          .map((i: any) => ({
            text: i.text || '',
            x: i.x,
            y: i.y,
            width: i.width,
            fontSize: i.fontSize,
            fontFamily: i.fontFamily,
            align: i.align,
            rotation: i.rotation || 0,
            color: i.color || '#000',
            fontWeight: i.fontWeight ?? 400,
            letterSpacing: i.letterSpacing ?? 0,
            lineHeight: i.lineHeight ?? 1.2,
          }));

        return { images, texts };
      });

      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages,
          pagePx,
          dpi: st.dpi,
          bleedMM: st.bleedMm,
        }),
      });

      if (!res.ok) throw new Error('Export PDF échoué');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raventech-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert((e as Error).message || 'Erreur export PDF');
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-30 h-full w-[280px] border-r border-slate-200 bg-white">
      {/* En-tête */}
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="text-sm font-semibold text-slate-900">Options</div>
        <div className="text-xs text-slate-500">Mise en page & affichage</div>
      </div>

      <div className="no-scrollbar h-[calc(100%-88px)] overflow-y-auto px-3 py-3 text-slate-900">
        {/* Taille d'album */}
        <section className="mb-4">
          <div className="mb-2 text-xs font-medium text-slate-600">Format album</div>
          <div className="grid grid-cols-2 gap-2">
            {ALBUM_SIZES.map((s) => (
              <button
                key={s.label}
                onClick={() => st.setSize(s)}
                className={`rounded border px-2 py-1 text-xs ${
                  st.size.label === s.label
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {/* Zoom */}
        <section className="mb-4">
          <div className="mb-2 text-xs font-medium text-slate-600">Zoom</div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.02}
              value={st.zoom}
              onChange={(e) => st.setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="w-10 text-right text-xs">{Math.round(st.zoom * 100)}%</div>
          </div>
        </section>

        {/* Affichage */}
        <section className="mb-4">
          <div className="mb-2 text-xs font-medium text-slate-600">Affichage</div>
          <div className="space-y-1 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={st.showGrid} onChange={st.toggleGrid} />
              Grille
            </label>
            <div className="flex items-center gap-2 pl-6">
              <span className="text-xs text-slate-500">Pas :</span>
              <input
                type="number"
                className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                value={st.gridSize}
                onChange={(e) => st.setGridSize(parseInt(e.target.value || '40', 10))}
                min={8}
                max={200}
              />
            </div>
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" checked={st.showGuides} onChange={st.toggleGuides} />
              Guides / Bleed / Safe
            </label>
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" checked={st.snap} onChange={st.toggleSnap} />
              Snap grille
            </label>
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" checked={st.magnet} onChange={st.toggleMagnet} />
              Aimantation (photos)
            </label>
            <div className="flex items-center gap-2 pl-6">
              <span className="text-xs text-slate-500">Tol. :</span>
              <input
                type="range"
                min={1}
                max={40}
                value={st.magnetTol}
                onChange={(e) => st.setMagnetTol(parseInt(e.target.value, 10))}
              />
              <span className="w-8 text-right text-xs">{st.magnetTol}px</span>
            </div>
          </div>
        </section>

        {/* Marges */}
        <section className="mb-4">
          <div className="mb-2 text-xs font-medium text-slate-600">Marges (mm)</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              <div className="mb-1 text-slate-500">Bleed</div>
              <input
                type="number"
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                value={st.bleedMm}
                min={0}
                onChange={(e) => st.setBleedMm(parseFloat(e.target.value || '0'))}
              />
            </label>
            <label className="text-xs">
              <div className="mb-1 text-slate-500">Safe</div>
              <input
                type="number"
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                value={st.safeMm}
                min={0}
                onChange={(e) => st.setSafeMm(parseFloat(e.target.value || '0'))}
              />
            </label>
          </div>
        </section>

        {/* Fond */}
        <section className="mb-4">
          <div className="mb-2 text-xs font-medium text-slate-600">Arrière-plan</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => st.setBackground({ type: 'solid', color1: '#ffffff' })}
              className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
            >
              Blanc
            </button>
            <button
              onClick={() => st.setBackground({ type: 'solid', color1: '#000000' })}
              className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
            >
              Noir
            </button>
            <button
              onClick={() =>
                st.setBackground({
                  type: 'linear',
                  color1: '#ffffff',
                  color2: '#f1f5f9',
                  angleDeg: 90,
                })
              }
              className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
            >
              Dégradé
            </button>
          </div>
        </section>

        {/* Auto-layout */}
        <section className="mb-4">
          <div className="mb-2 text-xs font-medium text-slate-600">Auto-layout</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => st.autoLayoutAuto()}
              className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            >
              Auto
            </button>
            <button
              onClick={() => st.autoLayout(2)}
              className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            >
              2 colonnes
            </button>
            <button
              onClick={() => st.autoLayout(3)}
              className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            >
              3 colonnes
            </button>
            <button
              onClick={() => st.autoLayout(4)}
              className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            >
              4 colonnes
            </button>
            <button
              onClick={() => st.autoLayoutMosaic()}
              className="col-span-2 rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            >
              Mosaïque équilibrée
            </button>
          </div>
        </section>

        {/* Outils */}
        <section className="mb-4">
          <div className="mb-2 text-xs font-medium text-slate-600">Outils</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => st.addText(40, 40, 'Votre titre')}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              + Texte
            </button>
            <button
              onClick={() => {
                const pg = st.pages[st.currentIndex];
                st.clearPage(pg.id);
              }}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Vider la page
            </button>
            <button
              onClick={handleExportPDF}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            >
              Export PDF
            </button>
          </div>
        </section>

        {/* Pages */}
        <section className="mb-2">
          <div className="mb-2 text-xs font-medium text-slate-600">Pages</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => st.addPage()}
              className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            >
              + Page
            </button>
            <button
              onClick={() => st.removePage(st.currentIndex)}
              className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
            >
              ‒ Supprimer
            </button>
            <div className="text-xs text-slate-500">
              {st.currentIndex + 1} / {st.pages.length}
            </div>
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {st.pages.map((p, i) => {
              const W = st.cmToPx(st.size.w * 2);
              const H = st.cmToPx(st.size.h);
              const r = 180 / W; // largeur vignette ~180px
              return (
                <button
                  key={p.id}
                  onClick={() => st.goTo(i)}
                  className={`shrink-0 rounded border ${
                    i === st.currentIndex ? 'border-indigo-500' : 'border-slate-300'
                  }`}
                  title={`Page ${i + 1}`}
                >
                  <div
                    className="relative bg-white"
                    style={{ width: Math.round(W * r), height: Math.round(H * r) }}
                  >
                    {/* mini repère pli */}
                    <div
                      className="absolute top-0 h-full border-l border-slate-300"
                      style={{ left: Math.round((W / 2) * r) }}
                    />
                    {/* points pour items */}
                    {p.items
                      .filter((it: any) => it.kind === 'photo')
                      .slice(0, 12)
                      .map((it: any) => (
                        <div
                          key={it.id}
                          className="absolute rounded-sm bg-slate-300/70"
                          style={{
                            left: Math.round(it.x * r),
                            top: Math.round(it.y * r),
                            width: Math.round(it.width * r),
                            height: Math.round(it.height * r),
                          }}
                        />
                      ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}