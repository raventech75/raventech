'use client';

import React from 'react';
import { useAlbumStore, type Asset } from '@/store/useAlbumStore';

function uid() {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID();
  return 'id_' + Math.random().toString(36).slice(2, 10);
}

export default function AssetsPanel() {
  const st = useAlbumStore();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [isHover, setIsHover] = React.useState(false);
  const [url, setUrl] = React.useState('');

  async function readImage(file: File): Promise<Asset | null> {
    const url = URL.createObjectURL(file);
    const img = new Image();
    return new Promise((resolve) => {
      img.onload = () => {
        const ar = img.width && img.height ? img.width / img.height : undefined;
        resolve({ id: uid(), url, ar });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function onPickFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const promises: Promise<Asset | null>[] = [];
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith('image/')) return;
      promises.push(readImage(f));
    });
    const results = (await Promise.all(promises)).filter(Boolean) as Asset[];
    if (results.length) st.addAssets(results);
  }

  async function importFromUrl() {
    const clean = url.trim();
    if (!clean) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ar = img.width && img.height ? img.width / img.height : undefined;
      st.addAsset({ id: uid(), url: clean, ar });
      setUrl('');
    };
    img.onerror = () => alert('Impossible de charger cette URL.');
    img.src = clean;
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHover(false);

    const files = e.dataTransfer.files;
    if (!files || !files.length) return;
    const promises: Promise<Asset | null>[] = [];
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith('image/')) return;
      promises.push(readImage(f));
    });
    const results = (await Promise.all(promises)).filter(Boolean) as Asset[];
    if (results.length) st.addAssets(results);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHover(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHover(false);
  };

  return (
    <div>
      {/* Barre d’import */}
      <div className="flex items-center gap-2 pb-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:shadow"
        >
          Importer des photos
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickFiles(e.target.files)}
        />

        <div className="flex items-center gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Coller une URL d’image…"
            className="w-64 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={importFromUrl}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:shadow"
          >
            Importer URL
          </button>
        </div>
      </div>

      {/* Zone de drop */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`mb-3 rounded-xl border-2 border-dashed ${
          isHover ? 'border-slate-400 bg-slate-50' : 'border-slate-200'
        } p-6 text-center text-sm text-slate-500`}
      >
        Glissez-déposez des images ici pour les importer
      </div>

      {/* Grille d’assets */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {st.assets.map((asset) => (
          <AssetCard key={asset.id} assetId={asset.id} />
        ))}
      </div>
    </div>
  );
}

function AssetCard({ assetId }: { assetId: string }) {
  const st = useAlbumStore();
  const asset = st.assets.find((a) => a.id === assetId)!;
  const usedCount = st.pages.reduce((acc, p) => acc + p.items.filter((i) => i.kind === 'photo' && (i as any).assetId === assetId).length, 0);
  const isUsedOnCurrent = st.pages[st.currentPageIndex].items.some((i) => i.kind === 'photo' && (i as any).assetId === assetId);

  const addToPage = () => {
    // Positionne un cadre 6x4 cm en haut-gauche avec AR de l'image
    const w = 6;
    const h = asset.ar ? w / asset.ar : 4;
    
    if ((st as any).addPhotoOnPage) {
      (st as any).addPhotoOnPage({
        assetId,
        x: 1,
        y: 1,
        w,
        h,
      });
    } else {
      const page = st.pages[st.currentPageIndex];
      const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : 'id_' + Math.random().toString(36).slice(2, 10);
      
      page.items.push({
        id,
        kind: 'photo' as const,
        x: 1,
        y: 1,
        w: w,        // ← Changez de "width: w" à "w: w"
        h: h,        // ← Changez de "height: h" à "h: h"
        opacity: 1,
        rotation: 0,
        assetId,
      } as any);
      
      // Sélectionner l'item ajouté
      (st as any).setSelected?.([id]);
    }
  };

  const removeAsset = () => {
    if (!confirm('Supprimer cette image de vos imports ? (ne supprime pas les éléments déjà placés)')) return;
    st.removeAsset(assetId);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-slate-100">
        <img
          src={asset.url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        {isUsedOnCurrent && (
          <div className="absolute left-2 top-2 rounded-md bg-emerald-600/90 px-2 py-0.5 text-xs font-medium text-white shadow">
            Utilisée sur la page
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-xs text-slate-500">{usedCount} placement{usedCount > 1 ? 's' : ''}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addToPage}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:shadow"
            title="Ajouter sur la page courante"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={removeAsset}
            className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
            title="Retirer de la liste"
          >
            Retirer
          </button>
        </div>
      </div>
    </div>
  );
}