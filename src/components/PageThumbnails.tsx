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
      className="relative rounded-md border border-slate-200 bg-white"
      style={{ width: w, height: h }}
    >
      {/* background */}
      {page.background?.image ? (
        <div
          className="absolute inset-0"
          style={{
            background: `url(${page.background.image}) center/cover no-repeat`,
          }}
        />
      ) : page.background?.linear ? (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${page.background.linear.angle}deg, ${page.background.linear.from}, ${page.background.linear.to})`,
          }}
        />
      ) : page.background?.fill ? (
        <div
          className="absolute inset-0"
          style={{ background: page.background.fill }}
        />
      ) : null}

      {/* items */}
      {page.items?.map((it: any) => {
        const x = it.x * 10 * scale;
        const y = it.y * 10 * scale;
        const w = (it.w ?? it.width) * 10 * scale;
        const h = (it.h ?? it.height) * 10 * scale;

        if (it.kind === 'photo') {
          return (
            <div
              key={it.id}
              className="absolute overflow-hidden rounded-sm border border-slate-200 bg-white"
              style={{ left: x, top: y, width: w, height: h }}
            >
              <img
                src={(() => {
                  const a = st.assets.find((a) => a.id === it.assetId);
                  return a?.url ?? '';
                })()}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
          );
        }

        if (it.kind === 'text') {
          return (
            <div
              key={it.id}
              className="absolute rounded-sm border border-slate-200 bg-white/60 text-[8px]"
              style={{
                left: x,
                top: y,
                width: w,
                height: h,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {it.text?.slice(0, 12) ?? 'Texte'}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

export default function PageThumbnails() {
  const st = useAlbumStore();
  // alias propre : on lit currentPageIndex mais on expose currentIndex en local pour ne rien casser
  const {
    pages,
    currentPageIndex: currentIndex,
    setPageIndex,
    addPage,
    removePage,
    duplicatePage,
  } = st as any;

  const [dragging, setDragging] = useState<number | null>(null);

  return (
    <div className="pointer-events-auto">
      <div className="absolute bottom-0 left-0 right-0">
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-md px-3 py-2 flex gap-3 overflow-x-auto max-w-[90%]">
          {pages.map((page: any, i: number) => (
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
                    // si ton store expose setState :
                    (st as any).setState?.({ pages: arr, currentPageIndex: i });
                    // sinon, on peut muter et signaler :
                    if (!(st as any).setState) {
                      (st as any).pages = arr;
                      (st as any).currentPageIndex = i;
                      (st as any).touch?.();
                    }
                  }
                  setDragging(null);
                }}
                onClick={() => setPageIndex?.(i)}
                className={
                  'rounded-md p-1 transition ' +
                  (i === currentIndex
                    ? 'bg-emerald-50 ring-2 ring-emerald-400'
                    : 'hover:bg-slate-50')
                }
              >
                <PagePreview page={page} />
              </div>

              {/* actions sur la vignette */}
              <div className="absolute -top-2 right-0 hidden gap-1 group-hover:flex">
                <button
                  onClick={() => duplicatePage?.(i)}
                  className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] hover:shadow"
                  title="Dupliquer"
                >
                  +1
                </button>
                <button
                  onClick={() => addPage?.(i + 1)}
                  className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] hover:shadow"
                  title="Ajouter après"
                >
                  +
                </button>
                <button
                  onClick={() => removePage?.(i)}
                  className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[11px] text-rose-700 hover:bg-rose-100"
                  title="Supprimer"
                >
                  ×
                </button>
              </div>

              {/* marqueur de sélection */}
              {i === currentIndex && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] text-white shadow">
                  Page {i + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}