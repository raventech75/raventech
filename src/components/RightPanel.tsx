'use client';

import { useRef, useState } from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function RightPanel() {
  const st = useAlbumStore();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<null | { done: number; total: number }>(null);

  const onPick = async (files: FileList | null) => {
    if (!files || !files.length) return;
    // Progression grossière: on “stream” par blocs en utilisant requestIdleCallback
    const arr = Array.from(files);
    const total = arr.length;
    let done = 0;
    setProgress({ done, total });

    const chunkSize = 4;
    for (let i = 0; i < arr.length; i += chunkSize) {
      const slice = arr.slice(i, i + chunkSize);
      await st.addAssets(slice); // ta fonction gère déjà le décodage performant
      done = Math.min(total, i + slice.length);
      setProgress({ done, total });
      // Laisse respirer le thread
      await new Promise((r) =>
        ('requestIdleCallback' in window
          ? (window as any).requestIdleCallback(() => r(null))
          : setTimeout(r, 0))
      );
    }
    setProgress(null);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Import */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Importation
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Importer des photos
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onPick(e.currentTarget.files)}
          />
        </div>

        {progress && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-slate-600">
              <span>Import…</span>
              <span>
                {progress.done}/{progress.total}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-2 bg-indigo-500 transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Carrousel des assets */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bibliothèque ({st.assets.length})
          </div>
          <div className="text-xs text-slate-500">
            Utilisées: {st.assets.filter((a) => a.used).length}
          </div>
        </div>

        {/* Carrousel horizontal */}
        <div className="h-[calc(100%-40px)] overflow-auto px-2 pb-2">
          <div className="flex gap-2">
            {st.assets.map((a) => (
              <div
                key={a.id}
                className={`relative w-32 shrink-0 rounded-lg border p-2 ${
                  a.used ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'
                }`}
                title={a.name}
              >
                <div className="aspect-[3/2] w-full overflow-hidden rounded bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={a.name}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </div>

                <div className="mt-2 flex flex-col gap-1">
                  {!a.used ? (
                    <button
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                      onClick={() => st.placePhotoAuto(a.id)}
                    >
                      Ajouter
                    </button>
                  ) : (
                    <button
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                      onClick={() => {
                        // Retire TOUTES les occurrences de cet asset de la page en cours
                        const page = st.pages[st.currentIndex];
                        const toDelete = page.items.filter(
                          (it: any) => it.kind === 'photo' && it.assetId === a.id
                        );
                        toDelete.forEach((it: any) => st.deleteItem(page.id, it.id));
                      }}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            ))}
            {st.assets.length === 0 && (
              <div className="p-3 text-sm text-slate-500">
                Aucune photo. Importez vos images pour commencer.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}