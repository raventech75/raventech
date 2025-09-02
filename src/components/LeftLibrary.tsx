'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

/** Carte asset avec + (ajout) et × (supprimer) */
function AssetCard({ assetId }: { assetId: string }) {
  const st = useAlbumStore();
  const asset = st.assets.find((a) => a.id === assetId)!;

  // griser si déjà utilisée (page courante)
  const inUse = st.isAssetUsedOnCurrentPage?.(assetId) ?? false;

  const addToPage = () => {
    if (inUse) return;
    if (st.addPhotoAutoPack) {
      st.addPhotoAutoPack(assetId);
    } else {
      // fallback simple
      const w = 6;
      const h = asset.ar ? w / asset.ar : 4;
      const id =
        (crypto as any)?.randomUUID
          ? (crypto as any).randomUUID()
          : 'it_' + Math.random().toString(36).slice(2);
      const pageIndex = st.currentPageIndex;
      const pg = st.pages[pageIndex];
      const maxZ = Math.max(0, ...pg.items.map((i) => i.z ?? 0));
      st.replaceItems(pageIndex, [
        ...pg.items,
        {
          id,
          kind: 'photo',
          assetId,
          x: 1,
          y: 1,
          w,
          h,
          z: maxZ + 1,
          scale: 1,
          rot: 0,
          opacity: 1,
        } as any,
      ]);
      st.selectItem(pageIndex, id);
    }
  };

  const removeThis = () => {
    // Empêcher la suppression si l’asset est posé sur la page courante
    if (inUse) return;
    st.removeAsset(assetId);
  };

  return (
    <div className="group relative rounded-xl border border-slate-200 overflow-hidden bg-white">
      <img
        src={(asset as any).previewUrl ?? asset.url}
        alt=""
        className={`w-full h-28 object-cover ${inUse ? 'opacity-40' : ''}`}
        draggable={false}
      />

      {/* bouton + (ajouter) */}
      <button
        onClick={addToPage}
        disabled={inUse}
        className={`absolute bottom-2 right-2 h-6 w-6 grid place-items-center rounded-full border text-[12px] transition
          ${
            inUse
              ? 'border-slate-200 text-slate-300 bg-white cursor-not-allowed'
              : 'border-sky-300 text-sky-700 bg-white/90 hover:bg-sky-50'
          }`}
        title={inUse ? 'Déjà utilisée sur la page' : 'Ajouter sur la page'}
      >
        +
      </button>

      {/* bouton × (supprimer de la librairie) */}
      <button
        onClick={removeThis}
        disabled={inUse}
        className={`absolute top-2 left-2 h-6 w-6 grid place-items-center rounded-full border text-[12px] transition
          ${
            inUse
              ? 'border-slate-200 text-slate-300 bg-white cursor-not-allowed'
              : 'border-rose-300 text-rose-700 bg-white/90 hover:bg-rose-50'
          }`}
        title={
          inUse
            ? "Impossible de supprimer : l'image est utilisée sur la page"
            : 'Supprimer de la librairie'
        }
      >
        ×
      </button>
    </div>
  );
}

export default function LeftLibrary() {
  const st = useAlbumStore();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const openPicker = () => fileInputRef.current?.click();

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;

    const list = Array.from(files);
    st.beginImportAssets?.(list.length); // progression ON

    const toAdd: { id: string; url: string; ar?: number; previewUrl?: string }[] = [];
    let done = 0;

    const BATCH_SIZE = 6;
    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const batch = list.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async (file) => {
          const id =
            (crypto as any)?.randomUUID
              ? (crypto as any).randomUUID()
              : 'as_' + Math.random().toString(36).slice(2);

          const url = URL.createObjectURL(file);

          let w = 0,
            h = 0;
          try {
            const bmp = await createImageBitmap(file);
            w = bmp.width;
            h = bmp.height;
            bmp.close?.();
          } catch {
            try {
              const img = await readImage(url);
              w = img.width;
              h = img.height;
            } catch {
              // ignore
            }
          }

          let previewUrl: string | undefined;
          try {
            previewUrl = await downscalePreview(url, 600);
          } catch {
            // ignore
          }

          return { id, url, ar: w && h ? w / h : undefined, previewUrl };
        })
      );

      for (const r of batchResults) {
        if (r.status === 'fulfilled' && r.value?.url) {
          toAdd.push(r.value);
        }
        done += 1;
        st.updateImportProgress?.(done); // progression ++
      }
    }

    if (toAdd.length) {
      st.addAssets(
        toAdd.map((a) => ({ id: a.id, url: a.url, ar: a.ar, previewUrl: a.previewUrl } as any))
      );
    }
    st.endImportAssets?.(); // progression OFF
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const progress = st.ui.importingAssets ?? { active: false, total: 0, done: 0 };
  const pct =
    progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Barre de progression (fine) */}
      {progress.active && (
        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
          <div className="px-3 py-2 flex items-center justify-between text-[12px] text-slate-600">
            <span>Import des photos…</span>
            <span>
              {progress.done}/{progress.total} ({pct}%)
            </span>
          </div>
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-sky-500 transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Contrôles import */}
      <div className="flex items-center gap-2">
        <button
          onClick={openPicker}
          className="h-8 px-3 rounded-full border border-slate-300 text-[12px] text-slate-700 bg-white hover:bg-slate-50"
        >
          Importer des photos…
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={onPickFiles}
        />
      </div>

      {/* Grille d’assets */}
      <div className="grid grid-cols-2 gap-2">
        {st.assets.map((a) => (
          <AssetCard key={a.id} assetId={a.id} />
        ))}
      </div>
    </div>
  );
}

/* utils */
function readImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

/** Downscale côté client pour previews fluides */
async function downscalePreview(srcUrl: string, maxSize = 600): Promise<string> {
  const img = await readImage(srcUrl);
  const ratio = Math.max(img.width, img.height) / maxSize;
  const w = ratio > 1 ? Math.round(img.width / ratio) : img.width;
  const h = ratio > 1 ? Math.round(img.height / ratio) : img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.8);
}