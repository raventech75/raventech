'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

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
    const toAdd: any[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        const ar = img.width && img.height ? img.width / img.height : undefined;
        const asset = { id: uid(), url, ar };
        toAdd.push(asset);
        
        // Ajouter l'asset au store
        if (typeof st.addAsset === 'function') {
          st.addAsset(asset);
        } else if (typeof st.addAssets === 'function') {
          st.addAssets([asset]);
        }
      };
      img.src = url;
    }
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
                title={`Image ${a.id}`}
                className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:shadow"
                onClick={() => {
                  // Ajouter l'image à la page courante
                  const currentPage = st.pages[st.currentPageIndex];
                  if (!currentPage) return;
                  
                  const id = Math.random().toString(36).slice(2);
                  const newItem = {
                    id,
                    kind: 'photo' as const,
                    x: 2, // 2cm du bord
                    y: 2, // 2cm du bord
                    w: 6, // 6cm de largeur
                    h: 4, // 4cm de hauteur
                    opacity: 1,
                    rotation: 0,
                    assetId: a.id,
                  };
                  
                  // Ajouter l'item à la page
                  currentPage.items.push(newItem as any);
                  
                  // Sélectionner l'item ajouté
                  st.selectedItemId = id;
                }}
              >
                {/* image */}
                <img src={a.url} alt={`Image ${a.id}`} className="absolute inset-0 w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}