/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useRef, useState } from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function RightSidebar() {
  const st = useAlbumStore();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  async function handlePick() {
    inputRef.current?.click();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setProgress({ done: 0, total: files.length });

    // Import hyper fluide : on passe le lot tel quel au store (il est déjà optimisé)
    // + petit feedback visuel de progression côté UI
    const arr = Array.from(files);
    let done = 0;

    // On divise en petits lots pour laisser respirer le thread UI
    const chunk = 10;
    for (let i = 0; i < arr.length; i += chunk) {
      const slice = arr.slice(i, i + chunk);
      await st.addAssets(slice as unknown as FileList);
      done += slice.length;
      setProgress({ done, total: files.length });
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 12)));
    }

    setBusy(false);
  }

  return (
    <aside className="col-span-3 xl:col-span-3 2xl:col-span-2 h-full rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-3 overflow-hidden">
      {/* IMPORT */}
      <section className="mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Importation</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePick}
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 shadow"
            disabled={busy}
          >
            Importer des photos
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {busy && (
          <div className="mt-3 text-xs text-slate-600">
            <div className="mb-1">Traitement… {progress.done} / {progress.total}</div>
            <div className="h-2 w-full rounded bg-slate-200 overflow-hidden">
              <div
                className="h-2 bg-sky-500 transition-[width] duration-150"
                style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* BIBLIOTHÈQUE – toutes les images à la suite, scroll vertical */}
      <section className="h-[calc(100%-100px)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700">
            Bibliothèque <span className="text-slate-400">({st.assets.length})</span>
          </h3>
        </div>

        <div className="h-[calc(100%-28px)] overflow-y-auto pr-1 custom-scroll">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-3">
            {st.assets.map((a) => (
              <div
                key={a.id}
                className={`rounded-lg border ${
                  a.used ? 'border-emerald-400 ring-1 ring-emerald-100' : 'border-slate-200'
                } bg-white p-2 shadow-sm`}
              >
                <div className="relative w-full rounded-md overflow-hidden bg-slate-100">
                  {/* Vignette rapide (objectURL) */}
                  <img
                    src={a.url}
                    alt={a.name}
                    loading="lazy"
                    className="block w-full h-36 object-cover"
                    draggable={false}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  {!a.used ? (
                    <button
                      onClick={() => st.placePhotoAuto(a.id)}
                      className="flex-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5"
                    >
                      Ajouter
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        // Retire tous les items de la page courante utilisant cet asset
                        const pg = st.pages[st.currentIndex];
                        const targets = pg.items.filter((it) => (it as any).kind === 'photo' && (it as any).assetId === a.id);
                        for (const it of targets) st.deleteItem(pg.id, it.id);
                      }}
                      className="flex-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-3 py-1.5"
                    >
                      Retirer
                    </button>
                  )}
                  <div className="text-[11px] text-slate-500 min-w-[72px] text-right">
                    {a.w}×{a.h}
                  </div>
                </div>
              </div>
            ))}

            {st.assets.length === 0 && (
              <div className="text-sm text-slate-500 col-span-full px-2 py-8 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50">
                Aucune photo pour l’instant. Utilisez « Importer des photos ».
              </div>
            )}
          </div>
        </div>
      </section>

      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </aside>
  );
}