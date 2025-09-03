'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

// Helper robuste : lit une propriété "name" si elle existe
function getAssetName(a: unknown): string | undefined {
  if (a && typeof a === 'object' && 'name' in (a as any)) {
    const n = (a as any).name;
    if (typeof n === 'string' && n.trim().length > 0) return n;
  }
  return undefined;
}

type Asset = { id: string; url: string; name?: string; type?: string; size?: number };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ✅ conversion cm → px locale (au lieu de dépendre du store)
function cmToPx(cm: number) {
  return (cm / 2.54) * 96;
}

export default function PlaceFromLibrary() {
  const st = useAlbumStore();
  const { assets } = st;
  const [isOver, setIsOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const toAdd: Asset[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(f);
      toAdd.push({ id: uid(), url, name: getAssetName(f), type: f.type, size: f.size });
    }
    if (!toAdd.length) return;

    useAlbumStore.setState((s) => ({ assets: [...s.assets, ...toAdd] }));
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    onFiles(e.dataTransfer.files);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };
  const onDragLeave = () => setIsOver(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 rounded-t-2xl bg-slate-50">
        <div className="text-sm font-semibold text-slate-900">Bibliothèque</div>
        <div className="text-xs text-slate-800">Images importées</div>
      </div>

      <div className="p-3">
        {/* Zone d'import */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={
            'rounded-xl border-2 border-dashed px-4 py-6 text-center transition ' +
            (isOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50')
          }
        >
          <p className="text-sm text-slate-900 mb-2">
            Glissez vos images ici, ou cliquez sur{' '}
            <button
              onClick={() => inputRef.current?.click()}
              className="text-indigo-600 hover:underline"
            >
              Importer
            </button>
            .
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>

        {/* Grille de miniatures */}
        {assets.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {assets.map((a) => (
              <button
                key={a.id}
                title={getAssetName(a) ?? 'image'}
                className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:shadow"
                onClick={() => {
                  const state = useAlbumStore.getState();
                  const page = state.pages[state.currentPageIndex];
                  const pageW = cmToPx(state.size.w * 2);
                  const pageH = cmToPx(state.size.h);

                  const w = Math.round(pageW * 0.28);
                  const h = Math.round(pageH * 0.28);
                  const x = Math.round((pageW - w) / 2);
                  const y = Math.round((pageH - h) / 2);

                 const newItem = {
  id: uid(),
  kind: 'photo' as const,
  x: x,
  y: y,
  w: w,        // ← Changez de "width: w" à "w: w"
  h: h,        // ← Changez de "height: h" à "h: h"
  opacity: 1,
  rotation: 0,
  assetId: a.id,
};

                  useAlbumStore.setState((s) => {
                    const pages = JSON.parse(JSON.stringify(s.pages));
                    const idx = s.currentPageIndex;
                    pages[idx].items.push(newItem);
                    return { pages };
                  });
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={getAssetName(a) ?? 'image'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}