'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

type Asset = { id: string; url: string; name?: string; type?: string; size?: number };

function uid() {
  return Math.random().toString(36).slice(2, 10);
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
      toAdd.push({ id: uid(), url, name: f.name, type: f.type, size: f.size });
    }
    if (!toAdd.length) return;

    // ✅ Zustand : on peut mettre à jour via setState sans modifier le store
    useAlbumStore.setState((s) => ({ assets: [...s.assets, ...toAdd] }));
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsOver(false);
    onFiles(e.dataTransfer.files);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsOver(true); };
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
          <p className="text-sm text-slate-900 mb-2">Glissez vos images ici, ou cliquez sur <button
            onClick={() => inputRef.current?.click()}
            className="text-indigo-600 hover:underline"
          >Importer</button>.</p>
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
                title={a.name || 'image'}
                className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:shadow"
                onClick={() => {
                  // Action au clic : à toi de choisir (ex: ajouter au canvas)
                  // Exemple simple : créer un item photo centré
                  const page = useAlbumStore.getState().pages[useAlbumStore.getState().currentIndex];
                  const cmToPx = useAlbumStore.getState().cmToPx;
                  const pageW = cmToPx(useAlbumStore.getState().size.w * 2);
                  const pageH = cmToPx(useAlbumStore.getState().size.h);
                  const w = Math.round(pageW * 0.28);
                  const h = Math.round(pageH * 0.28);
                  const x = Math.round((pageW - w) / 2);
                  const y = Math.round((pageH - h) / 2);
                  const newItem = {
                    id: uid(),
                    kind: 'photo' as const,
                    x, y, width: w, height: h, opacity: 1, rotation: 0, assetId: a.id,
                  };
                  useAlbumStore.setState((s) => {
                    const pages = JSON.parse(JSON.stringify(s.pages));
                    const idx = s.currentIndex;
                    pages[idx].items.push(newItem);
                    return { pages };
                  });
                }}
              >
                {/* image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name || 'image'} className="absolute inset-0 w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}