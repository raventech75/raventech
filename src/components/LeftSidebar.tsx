/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function LeftSidebar() {
  const st = useAlbumStore();

  // ------ Import ------
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  const onPickFiles = () => fileRef.current?.click();

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImporting(true);
    setProgress({ done: 0, total: files.length });
    try {
      await st.addAssets(files, (done, total) => setProgress({ done, total }));
    } finally {
      // petit délai pour laisser voir 100%
      setTimeout(() => {
        setImporting(false);
        setProgress({ done: 0, total: 0 });
        if (fileRef.current) fileRef.current.value = '';
      }, 300);
    }
  };

  // ------ Bibliothèque (pagination simple) ------
  const pageSize = 12; // 3 colonnes x 4 lignes par ex.
  const [libPage, setLibPage] = React.useState(0);
  const totalPages = Math.max(1, Math.ceil(st.assets.length / pageSize));
  const start = libPage * pageSize;
  const pageAssets = st.assets.slice(start, start + pageSize);

  React.useEffect(() => {
    if (libPage > totalPages - 1) setLibPage(Math.max(0, totalPages - 1));
  }, [st.assets.length, totalPages, libPage]);

  const curPage = st.pages[st.currentIndex];

  function onAdd(assetId: string) {
    st.placePhotoAuto(assetId);
  }

  function onRemoveFromCurrent(assetId: string) {
    const item = curPage.items.find(
      (it: any) => it.kind === 'photo' && it.assetId === assetId
    );
    if (item) st.deleteItem(curPage.id, item.id);
  }

  // ------ Pages (liste verticale) ------
  return (
    <aside className="col-span-3 flex h-full flex-col gap-3 overflow-hidden pr-1">
      {/* IMPORT */}
      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-700">Importation</h3>
        <div className="mt-3">
          <button
            onClick={onPickFiles}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Importer des photos
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.jpg,.jpeg,.png,.webp,.tif,.tiff"
            className="hidden"
            onChange={onFiles}
          />

          {importing && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>Import en cours…</span>
                <span>
                  {progress.done}/{progress.total}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
                <div
                  className="h-2 bg-indigo-500 transition-[width]"
                  style={{
                    width:
                      progress.total > 0
                        ? `${Math.min(
                            100,
                            Math.round((progress.done / progress.total) * 100)
                          )}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* BIBLIOTHÈQUE */}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-lg font-semibold text-slate-700">
            Bibliothèque ({st.assets.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLibPage((p) => Math.max(0, p - 1))}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={libPage === 0}
              title="Précédent"
            >
              ◀
            </button>
            <span className="text-sm text-slate-600">
              {totalPages === 0 ? 0 : libPage + 1}/{totalPages}
            </span>
            <button
              onClick={() => setLibPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={libPage >= totalPages - 1}
              title="Suivant"
            >
              ▶
            </button>
          </div>
        </div>

        <div className="scrollbar-thin grid flex-1 grid-cols-3 gap-3 overflow-auto p-3">
          {pageAssets.map((a) => {
            const usedHere = curPage.items.some(
              (it: any) => it.kind === 'photo' && it.assetId === a.id
            );
            return (
              <div
                key={a.id}
                className={[
                  'relative rounded-lg border p-2',
                  usedHere ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white',
                ].join(' ')}
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded border border-slate-200 bg-slate-50">
                  <img
                    src={a.url}
                    alt={a.name}
                    className={[
                      'h-full w-full object-cover',
                      a.used ? 'opacity-60' : 'opacity-100',
                    ].join(' ')}
                    draggable={false}
                  />
                </div>

                {a.used && (
                  <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                    Utilisée
                  </span>
                )}

                <div className="mt-2">
                  {usedHere ? (
                    <button
                      onClick={() => onRemoveFromCurrent(a.id)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm hover:bg-slate-50"
                    >
                      Retirer
                    </button>
                  ) : (
                    <button
                      onClick={() => onAdd(a.id)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm hover:bg-slate-50 disabled:opacity-50"
                      disabled={a.used} // grisé si déjà utilisée (ailleurs)
                      title={a.used ? 'Déjà utilisée dans une autre page' : 'Ajouter sur la page'}
                    >
                      Ajouter
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {st.assets.length === 0 && (
            <div className="col-span-3 grid place-items-center py-12 text-sm text-slate-500">
              Aucune photo importée pour le moment.
            </div>
          )}
        </div>
      </section>

      {/* PAGES (liste verticale) */}
      <section className="min-h-0 overflow-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-700">
            Pages ({st.pages.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => st.addPage()}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={st.pages.length >= 25}
              title="Ajouter une page"
            >
              +
            </button>
            <button
              onClick={() => st.removePage(st.currentIndex)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={st.pages.length <= 1}
              title="Supprimer la page courante"
            >
              –
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {st.pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => st.goTo(i)}
              className={[
                'w-full rounded-lg border p-2 text-left',
                i === st.currentIndex
                  ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="text-sm font-medium text-slate-800">Page {i + 1}</div>
              <div className="mt-2 h-20 rounded border border-dashed border-slate-300 bg-slate-50" />
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}