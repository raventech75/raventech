'use client';

import React, { useState } from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

function PagePreview({ page }: { page: any }) {
  const st = useAlbumStore.getState();
  const scale = 0.15;
  const w = st.size.w * 10 * scale;
  const h = st.size.h * 10 * scale;

  return (
    <div
      className="relative bg-white border border-slate-200 overflow-hidden rounded-sm"
      style={{ width: w, height: h }}
    >
      {page.items.map((it: any) =>
        it.kind === 'photo' ? (
          <div
            key={it.id}
            className="absolute bg-slate-300"
            style={{
              left: it.x * scale,
              top: it.y * scale,
              width: it.w * scale,
              height: it.h * scale,
              backgroundImage: it.assetId
                ? `url(${st.assets.find((a) => a.id === it.assetId)?.url})`
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ) : null
      )}
    </div>
  );
}

export default function PageThumbnails() {
  const st = useAlbumStore();
  const { pages, currentIndex, setPageIndex, addPage, removePage, duplicatePage } = st;

  const [dragging, setDragging] = useState<number | null>(null);

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-md px-3 py-2 flex gap-3 overflow-x-auto max-w-[90%]">
      {pages.map((page, i) => (
        <div key={page.id} className="relative group">
          <div
            draggable
            onDragStart={() => setDragging(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragging !== null && dragging !== i) {
                const arr = [...pages];
                const [moved] = arr.splice(dragging, 1);
                arr.splice(i, 0, moved);
                st.setState({ pages: arr, currentIndex: i });
              }
              setDragging(null);
            }}
            className={`flex-shrink-0 p-1 rounded-md shadow-sm cursor-grab ${
              currentIndex === i
                ? 'ring-2 ring-indigo-500'
                : 'hover:ring-1 hover:ring-slate-300'
            } ${dragging === i ? 'opacity-50' : ''}`}
            onClick={() => setPageIndex(i)}
            title={`Page ${i + 1}`}
          >
            <PagePreview page={page} />
            <div className="absolute bottom-0 right-0 text-[9px] bg-white/80 px-1 rounded-tl text-slate-600 border border-slate-200">
              {i + 1}
            </div>
          </div>

          {/* Actions supprimer / dupliquer */}
          <div className="absolute -top-2 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => duplicatePage(i)}
              className="text-xs px-1 bg-white border rounded shadow hover:bg-slate-50"
              title="Dupliquer"
            >
              📑
            </button>
            <button
              onClick={() => removePage(i)}
              className="text-xs px-1 bg-white border rounded shadow hover:bg-slate-50"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}

      {/* Bouton ajouter page */}
      <button
        onClick={() => addPage()}
        className="flex-shrink-0 w-16 h-12 flex items-center justify-center border border-dashed border-slate-300 rounded-md text-slate-400 hover:text-indigo-500 hover:border-indigo-400"
      >
        +
      </button>
    </div>
  );
}