'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

// Helper robuste : lit une propriété "name" si elle existe, sinon undefined
function getAssetName(a: unknown): string | undefined {
  if (a && typeof a === 'object' && 'name' in (a as any)) {
    const n = (a as any).name;
    if (typeof n === 'string' && n.trim().length > 0) return n;
  }
  return undefined;
}

export default function AssetDock() {
  const st = useAlbumStore();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-3 left-3 z-50 rounded-full border border-slate-300 bg-white/90 shadow px-3 py-2 text-sm hover:shadow-md"
      >
        {open ? 'Fermer la bibliothèque' : 'Bibliothèque'}
      </button>

      {open && (
        <div className="fixed left-0 right-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-600">
                {st.assets.length} images
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-xs rounded-md border border-slate-200 px-2 py-1 bg-white hover:shadow"
              >
                Fermer
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {st.assets.map((a) => {
                const label = getAssetName(a) ?? 'image';
                return (
                  <button
                    key={a.id}
                    className="shrink-0 w-20 h-20 rounded-md border border-slate-200 overflow-hidden bg-white hover:shadow-sm"
                    title={label}
                    onClick={() => {
                      const p = st.pages[st.currentPageIndex]; // propriété correcte
                      const id = Math.random().toString(36).slice(2);
                      const ph = {
                        id,
                        kind: 'photo' as const,
                        x: 24,
                        y: 24,
                        width: 220,
                        height: 160,
                        opacity: 1,
                        rotation: 0,
                        assetId: a.id,
                      };
                      p.items.push(ph as any);
                      // Appel seulement si présent dans le store (évite l'erreur TS + runtime)
                      (st as any).setSelected?.([id]);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={label} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}