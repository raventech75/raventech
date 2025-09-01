'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function RightDock() {
  const st = useAlbumStore();
  const [open, setOpen] = React.useState(true);
  const [width, setWidth] = React.useState<number>(() => {
    if (typeof window === 'undefined') return 360;
    const v = Number(localStorage.getItem('rt-dock-w'));
    return Number.isFinite(v) && v >= 260 && v <= 560 ? v : 360;
  });
  const resizingRef = React.useRef(false);

  React.useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!resizingRef.current) return;
      const vw = Math.max(260, Math.min(560, window.innerWidth - e.clientX));
      setWidth(vw);
    }
    function onUp() {
      if (resizingRef.current) {
        resizingRef.current = false;
        localStorage.setItem('rt-dock-w', String(width));
      }
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [width]);

  const onFiles = async (files: FileList | File[]) => {
    await st.addAssets(files);
  };

  return (
    <aside
      className="fixed right-0 top-0 z-30 h-full border-l border-slate-200 bg-white"
      style={{ width: open ? width : 40 }}
    >
      {/* poignée de resize */}
      {open && (
        <div
          className="absolute left-0 top-0 h-full w-1 cursor-col-resize bg-transparent"
          onMouseDown={() => (resizingRef.current = true)}
          title="Redimensionner"
        />
      )}

      {/* bouton collapse */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="absolute left-[-30px] top-4 rounded-l-md border border-slate-200 bg-white px-2 py-1 text-xs shadow"
        title={open ? 'Réduire' : 'Ouvrir'}
      >
        {open ? '›' : '‹'}
      </button>

      {/* contenu */}
      {open ? (
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <div className="font-medium text-slate-900">Bibliothèque</div>
            <div className="text-xs text-slate-500">{st.assets.length}/150</div>
          </div>

          {/* Zone d’import */}
          <div
            className="m-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-sm text-slate-600"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
            }}
          >
            Glissez vos images ici<br />
            ou
            <label className="ml-2 cursor-pointer rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 hover:bg-slate-50">
              Parcourir
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const f = e.currentTarget.files;
                  if (f && f.length) onFiles(f);
                  e.currentTarget.value = '';
                }}
              />
            </label>
          </div>

          {/* Carrousel d’assets */}
          <div className="mx-3 mb-2 text-xs text-slate-500">Photos importées</div>
          <div className="no-scrollbar mx-3 flex gap-2 overflow-x-auto pb-3">
            {st.assets.map((a) => (
              <div
                key={a.id}
                className={`group relative flex w-28 shrink-0 select-none flex-col items-center rounded-lg border p-2 ${a.used ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                title={a.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt=""
                  className="h-20 w-full rounded object-cover"
                  draggable={false}
                />
                <div className="mt-2 line-clamp-1 w-full text-[11px] text-slate-600">{a.name}</div>

                <div className="mt-2 flex w-full gap-1">
                  <button
                    className="flex-1 rounded border border-slate-300 px-1 py-1 text-[11px] hover:bg-slate-50"
                    onClick={() => {
                      // placement auto homothétique + marquage used déjà géré dans store
                      st.placePhoto(a.id);
                    }}
                    disabled={a.used && !st.pages[st.currentIndex].items.some((i: any) => i.kind === 'photo' && i.assetId === a.id)}
                    title="Ajouter sur la page"
                  >
                    Ajouter
                  </button>
                  <button
                    className="flex-1 rounded border border-slate-300 px-1 py-1 text-[11px] hover:bg-slate-50"
                    onClick={() => {
                      // supprime les items de cette page pour cet asset et libère l’asset s’il n’est plus utilisé
                      const pg = st.pages[st.currentIndex];
                      pg.items
                        .filter((i: any) => i.kind === 'photo' && i.assetId === a.id)
                        .forEach((i: any) => st.deleteItem(pg.id, i.id));
                    }}
                    title="Retirer de la page"
                  >
                    Retirer
                  </button>
                </div>

                {a.used && (
                  <span className="absolute right-2 top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white shadow">
                    utilisé
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Actions bas */}
          <div className="mt-auto border-t border-slate-200 p-3">
            <button
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
              onClick={() => st.autoFill( st.pages[st.currentIndex].items.filter((i: any) => i.kind==='photo').length ?  (2 as 1|2|3|4) : (3 as 1|2|3|4) )}
            >
              Auto-remplir + layout
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center text-[10px] text-slate-400 rotate-180 writing-vertical">
          {/* replié */}
        </div>
      )}
    </aside>
  );
}