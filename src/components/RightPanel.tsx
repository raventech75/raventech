/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef, useState } from 'react';
import { useAlbumStore, type PhotoAsset } from '@/store/useAlbumStore';

export default function RightPanel() {
  const st = useAlbumStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  const { importProgress } = st;

  const removeFirstUseOf = (assetId: string) => {
    const page = st.pages[st.currentIndex];
    const it = page.items.find(i => (i as any).kind === 'photo' && (i as any).assetId === assetId);
    if (it) st.deleteItem(page.id, it.id);
  };

  return (
    <aside
      className={`
        w-[340px] shrink-0 border-l border-slate-200
        bg-white/90 backdrop-blur
        transition-all duration-300
        ${collapsed ? 'translate-x-[300px] w-[40px]' : ''}
      `}
    >
      <div className="h-12 flex items-center justify-between px-3">
        <h3 className="text-sm font-semibold text-slate-800">Import</h3>
        <button
          className="rounded-full border border-slate-300 w-7 h-7 grid place-items-center hover:bg-slate-50"
          onClick={()=> setCollapsed(v=>!v)}
          title={collapsed ? 'Déplier' : 'Replier'}
        >
          {collapsed ? '«' : '»'}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-3">
          {/* Import actions */}
          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e)=> e.currentTarget.files && st.addAssets(e.currentTarget.files)}
            />
            <button
              onClick={()=> fileRef.current?.click()}
              className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 px-3 py-2 text-white font-medium shadow hover:opacity-95"
            >
              Importer des photos
            </button>

            {/* Progress */}
            {importProgress.running && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Import en cours…</span>
                  <span>{importProgress.done}/{importProgress.total}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${importProgress.total ? (importProgress.done/importProgress.total)*100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tout placer (page de 10) */}
            {!importProgress.running && st.assets.some(a => !a.used) && (
              <button
                onClick={()=> st.placeManyAutoPages(10)}
                className="mt-3 w-full rounded-lg border border-indigo-500 text-indigo-600 font-medium py-2 hover:bg-indigo-50"
              >
                Tout placer (10 par page)
              </button>
            )}
          </div>

          {/* Carrousel */}
          <div className="rounded-xl border border-slate-200 bg-white p-2">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-xs text-slate-600">Bibliothèque ({st.assets.length})</span>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {st.assets.map((a: PhotoAsset) => (
                <div
                  key={a.id}
                  className={`relative shrink-0 rounded-lg border ${a.used ? 'border-emerald-400' : 'border-slate-200'} bg-white p-1`}
                >
                  <img
                    src={a.url}
                    alt={a.name}
                    className="h-24 w-32 object-cover rounded"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {!a.used ? (
                      <button
                        onClick={()=> st.placePhotoAuto(a.id)}
                        className="col-span-2 rounded bg-indigo-600 text-white text-xs py-1 hover:bg-indigo-700"
                      >
                        Ajouter
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={()=> removeFirstUseOf(a.id)}
                          className="col-span-2 rounded border border-slate-300 text-xs py-1 hover:bg-slate-50"
                        >
                          Retirer de la page
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {st.assets.length===0 && (
                <div className="text-xs text-slate-500 px-2 py-6">Aucune photo importée.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}