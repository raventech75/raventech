/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function Thumbs() {
  const { pages, currentIndex, goTo, size } = useAlbumStore();

  // petit helper pour calculer une vignette proportionnelle
  const thumbW = 120; // largeur fixe des vignettes
  const ratio = (size.w * 2) / size.h; // double page
  const thumbH = Math.max(60, Math.round(thumbW / ratio));

  return (
    <div className="flex gap-3 border-t border-slate-200 bg-white px-3 py-2 overflow-x-auto">
      {pages.map((pg, i) => {
        const photoCount = pg.items.filter((it: any) => it.kind === 'photo').length;
        const textCount = pg.items.filter((it: any) => it.kind === 'text').length;
        const isActive = i === currentIndex;

        return (
          <button
            key={pg.id}
            onClick={() => goTo(i)}
            className={[
              'shrink-0 rounded-lg border shadow-sm hover:shadow transition',
              isActive ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-slate-200',
            ].join(' ')}
            style={{ width: thumbW, height: thumbH }}
            title={`Page ${i + 1}`}
          >
            {/* Mini mockup double-page */}
            <div className="relative h-full w-full bg-white rounded-md overflow-hidden">
              {/* pli central */}
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300/80" />
              {/* cadre */}
              <div className="absolute inset-0 rounded-md ring-1 ring-slate-200" />
              {/* stats rapides */}
              <div className="absolute left-1 top-1 text-[10px] px-1.5 py-0.5 rounded bg-white/80 text-slate-600 border border-slate-200">
                {i + 1}
              </div>
              <div className="absolute right-1 bottom-1 text-[10px] px-1.5 py-0.5 rounded bg-white/80 text-slate-600 border border-slate-200">
                {photoCount} 📷 · {textCount} ✎
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}