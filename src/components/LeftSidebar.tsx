/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import {
  useAlbumStore,
  ALBUM_SIZES,
  type PhotoItem,
  type TextItem,
} from '@/store/useAlbumStore';

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-2xl border border-slate-200 bg-white/90 backdrop-blur transition hover:border-slate-300"
      open={defaultOpen}
    >
      <summary className="cursor-pointer select-none list-none rounded-2xl px-4 py-3 font-medium text-slate-800 flex items-center justify-between">
        <span className="text-sm uppercase tracking-wide">{title}</span>
        <svg
          className="h-4 w-4 text-slate-500 transition group-open:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="px-4 pb-4 pt-2">{children}</div>
    </details>
  );
}

export default function LeftSidebar() {
  const st = useAlbumStore();
  const {
    size,
    setSize,
    zoom,
    setZoom,
    pages,
    currentIndex,
    goTo,
    autoLayout,
    autoLayoutAuto,
    autoLayoutMosaic,
    autoFill,
    toggleGrid,
    showGrid,
    setGridSize,
    gridSize,
    toggleGuides,
    showGuides,
    toggleSnap,
    snap,
  } = st;

  const page = pages[currentIndex];
  const selId = st.selectedIds[0] || null;
  const selItem = selId
    ? (page.items.find((i) => i.id === selId) as PhotoItem | TextItem | undefined)
    : undefined;

  return (
    <aside
      className="
        w-80 shrink-0
        border-r border-slate-200
        bg-gradient-to-b from-white/95 to-white/80 backdrop-blur
        px-3 py-4
        sticky top-0 h-[100vh] overflow-auto
        flex flex-col gap-4
      "
    >
      {/* Projet (placeholder si tu veux y remettre la gestion des projets) */}
      <Section title="Projet" defaultOpen={false}>
        <div className="text-xs text-slate-600">
          {st.project ? (
            <>
              <div className="font-medium text-slate-800">{st.project.name}</div>
              <div>ID: {st.project.id}</div>
            </>
          ) : (
            <div>Aucun projet sélectionné.</div>
          )}
        </div>
      </Section>

      {/* Formats */}
      <Section title="Formats">
        <div className="grid grid-cols-2 gap-2">
          {ALBUM_SIZES.map((s) => {
            const active = s.label === size.label;
            return (
              <button
                key={s.label}
                onClick={() => setSize(s)}
                className={`rounded-xl border px-2 py-2 text-sm text-left transition ${
                  active
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Affichage */}
      <Section title="Affichage">
        <div className="flex items-center gap-2">
          <span className="text-xs w-10 text-right text-slate-500">
            {Math.round(zoom * 100)}%
          </span>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showGrid} onChange={toggleGrid} />
            Grille
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showGuides} onChange={toggleGuides} />
            Repères
          </label>

          <label className="col-span-2 flex items-center gap-2">
            <span className="w-20 text-xs text-slate-500">Pas grille</span>
            <input
              type="range"
              min={8}
              max={200}
              step={1}
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600"
            />
            <span className="w-10 text-right text-xs">{gridSize}</span>
          </label>

          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={snap} onChange={toggleSnap} />
            Snap à la grille
          </label>
        </div>
      </Section>

      {/* Auto-layout */}
      <Section title="Auto-layout">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => autoLayout(1)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm hover:bg-slate-50"
          >
            1 col
          </button>
          <button
            onClick={() => autoLayout(2)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm hover:bg-slate-50"
          >
            2 col
          </button>
          <button
            onClick={() => autoLayout(3)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm hover:bg-slate-50"
          >
            3 col
          </button>
          <button
            onClick={() => autoLayout(4)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm hover:bg-slate-50"
          >
            4 col
          </button>

          <button
            onClick={autoLayoutAuto}
            className="col-span-2 rounded-lg border border-slate-300 px-2 py-2 text-sm hover:bg-slate-50"
          >
            Auto (optimal)
          </button>
          <button
            onClick={autoLayoutMosaic}
            className="col-span-2 rounded-lg border border-slate-300 px-2 py-2 text-sm hover:bg-slate-50"
          >
            Mosaïque équilibrée
          </button>
          <button
            onClick={() => autoFill(3)}
            className="col-span-2 rounded-lg border border-slate-300 px-2 py-2 text-sm hover:bg-slate-50"
          >
            Auto-remplir (≈3)
          </button>
        </div>
      </Section>

      {/* Pages */}
      <Section title="Pages">
        <div className="max-h-56 overflow-auto rounded-xl border border-slate-200">
          {pages.map((p, i) => {
            const active = i === currentIndex;
            return (
              <button
                key={p.id}
                onClick={() => goTo(i)}
                className={`block w-full text-left px-3 py-2 border-b last:border-b-0 transition ${
                  active
                    ? 'bg-indigo-50 text-indigo-800'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                Page {i + 1}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Élément sélectionné */}
      <Section title="Élément sélectionné" defaultOpen={!!selItem}>
        {!selItem && (
          <p className="text-xs text-slate-500">
            Sélectionnez une photo ou un texte pour voir ses options.
          </p>
        )}

        {selItem?.kind === 'photo' && (
          <PhotoControls item={selItem as PhotoItem} pageId={page.id} />
        )}

        {selItem?.kind === 'text' && (
          <TextControls item={selItem as TextItem} pageId={page.id} />
        )}
      </Section>

      {/* Footer infos small */}
      <div className="mt-1 text-[11px] text-slate-500 text-center">
        © {new Date().getFullYear()} RavenTech
      </div>
    </aside>
  );
}

/* ---------------- Photo controls (branch photo) ---------------- */
function PhotoControls({ item, pageId }: { item: PhotoItem; pageId: string }) {
  const st = useAlbumStore();
  return (
    <div className="space-y-3">
      {/* Opacité */}
      <label className="flex items-center gap-2">
        <span className="w-20 text-xs text-slate-500">Opacité</span>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={item.opacity ?? 1}
          onChange={(e) =>
            st.updateItem(pageId, item.id, { opacity: parseFloat(e.target.value) })
          }
          className="w-full accent-indigo-600"
        />
        <span className="w-10 text-right text-xs">
          {Math.round((item.opacity ?? 1) * 100)}%
        </span>
      </label>

      {/* Bordure */}
      <label className="flex items-center gap-2">
        <span className="w-20 text-xs text-slate-500">Bordure</span>
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={item.borderW ?? 0}
          onChange={(e) =>
            st.updateItem(pageId, item.id, { borderW: parseInt(e.target.value, 10) })
          }
          className="w-full accent-indigo-600"
        />
        <input
          type="color"
          value={item.borderColor ?? '#111827'}
          onChange={(e) => st.updateItem(pageId, item.id, { borderColor: e.target.value })}
          className="h-6 w-10"
          aria-label="Couleur bordure"
        />
      </label>

      {/* Coins arrondis */}
      <label className="flex items-center gap-2">
        <span className="w-20 text-xs text-slate-500">Coins</span>
        <input
          type="range"
          min={0}
          max={80}
          step={1}
          value={item.cornerR ?? 0}
          onChange={(e) =>
            st.updateItem(pageId, item.id, { cornerR: parseInt(e.target.value, 10) })
          }
          className="w-full accent-indigo-600"
        />
        <span className="w-10 text-right text-xs">{item.cornerR ?? 0}</span>
      </label>

      {/* Fondus */}
      <div className="rounded-xl border border-slate-200 p-2">
        <p className="text-xs font-medium text-slate-600 mb-1">Fondus</p>

        <label className="flex items-center gap-2">
          <span className="w-20 text-xs text-slate-500">Haut</span>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={item.fadeTop ?? 0}
            onChange={(e) =>
              st.updateItem(pageId, item.id, { fadeTop: parseInt(e.target.value, 10) })
            }
            className="w-full accent-indigo-600"
          />
          <span className="w-10 text-right text-xs">{item.fadeTop ?? 0}</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="w-20 text-xs text-slate-500">Bas</span>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={item.fadeBottom ?? 0}
            onChange={(e) =>
              st.updateItem(pageId, item.id, { fadeBottom: parseInt(e.target.value, 10) })
            }
            className="w-full accent-indigo-600"
          />
          <span className="w-10 text-right text-xs">{item.fadeBottom ?? 0}</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="w-20 text-xs text-slate-500">Gauche</span>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={item.fadeLeft ?? 0}
            onChange={(e) =>
              st.updateItem(pageId, item.id, { fadeLeft: parseInt(e.target.value, 10) })
            }
            className="w-full accent-indigo-600"
          />
          <span className="w-10 text-right text-xs">{item.fadeLeft ?? 0}</span>
        </label>

        <label className="flex items-center gap-2">
          <span className="w-20 text-xs text-slate-500">Droit</span>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={item.fadeRight ?? 0}
            onChange={(e) =>
              st.updateItem(pageId, item.id, { fadeRight: parseInt(e.target.value, 10) })
            }
            className="w-full accent-indigo-600"
          />
          <span className="w-10 text-right text-xs">{item.fadeRight ?? 0}</span>
        </label>
      </div>
    </div>
  );
}

/* ---------------- Text controls (branch text) ---------------- */
function TextControls({ item, pageId }: { item: TextItem; pageId: string }) {
  const st = useAlbumStore();
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">
        <span className="w-20 text-xs text-slate-500">Texte</span>
        <input
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
          value={item.text ?? ''}
          onChange={(e) => st.updateItem(pageId, item.id, { text: e.target.value })}
        />
      </label>

      <label className="flex items-center gap-2">
        <span className="w-20 text-xs text-slate-500">Taille</span>
        <input
          type="range"
          min={8}
          max={160}
          step={1}
          value={item.fontSize ?? 32}
          onChange={(e) =>
            st.updateItem(pageId, item.id, { fontSize: parseInt(e.target.value, 10) })
          }
          className="w-full accent-indigo-600"
        />
        <span className="w-10 text-right text-xs">{item.fontSize ?? 32}</span>
      </label>

      <label className="flex items-center gap-2">
        <span className="w-20 text-xs text-slate-500">Police</span>
        <input
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
          value={item.fontFamily ?? 'Inter, system-ui, sans-serif'}
          onChange={(e) => st.updateItem(pageId, item.id, { fontFamily: e.target.value })}
        />
      </label>

      <div className="flex items-center gap-2">
        <span className="w-20 text-xs text-slate-500">Align</span>
        <select
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
          value={item.align ?? 'left'}
          onChange={(e) => st.updateItem(pageId, item.id, { align: e.target.value as any })}
        >
          <option value="left">Gauche</option>
          <option value="center">Centre</option>
          <option value="right">Droite</option>
        </select>
      </div>

      <label className="flex items-center gap-2">
        <span className="w-20 text-xs text-slate-500">Couleur</span>
        <input
          type="color"
          value={item.color ?? '#000000'}
          onChange={(e) => st.updateItem(pageId, item.id, { color: e.target.value })}
          className="h-6 w-10"
          aria-label="Couleur du texte"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Graisse</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
            value={item.fontWeight ?? 400}
            onChange={(e) =>
              st.updateItem(pageId, item.id, { fontWeight: parseInt(e.target.value, 10) })
            }
          >
            <option value={300}>Light</option>
            <option value={400}>Regular</option>
            <option value={500}>Medium</option>
            <option value={600}>Semibold</option>
            <option value={700}>Bold</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Esp. lettres</span>
          <input
            type="number"
            step={0.1}
            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
            value={item.letterSpacing ?? 0}
            onChange={(e) =>
              st.updateItem(pageId, item.id, { letterSpacing: parseFloat(e.target.value) })
            }
          />
        </label>
      </div>

      <label className="flex items-center gap-2">
        <span className="w-20 text-xs text-slate-500">Interligne</span>
        <input
          type="number"
          step={0.05}
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
          value={item.lineHeight ?? 1.2}
          onChange={(e) =>
            st.updateItem(pageId, item.id, { lineHeight: parseFloat(e.target.value) })
          }
        />
      </label>
    </div>
  );
}