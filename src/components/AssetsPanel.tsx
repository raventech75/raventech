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

  const readImage = (file: File) =>
    new Promise<Asset | null>((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const ar = img.width && img.height ? img.width / img.height : undefined;
        resolve({ id: uid(), url, ar });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHover(false);
    const files = e.dataTransfer?.files || null;
    onPickFiles(files);
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
      {/* Barre d'import */}
      <div className="flex items-center gap-2 pb-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full px-3 py-1.5 text-[12px] bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
        >
          Importer des images
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onPickFiles(e.target.files)}
        />

        <div className="flex items-center gap-1">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Coller une URL d'image…"
            className="text-[12px] border rounded-full px-3 py-1.5 w-[180px]"
          />
          <button
            type="button"
            onClick={importFromUrl}
            className="rounded-full px-3 py-1.5 text-[12px] bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* Zone drag & drop */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`rounded-2xl border-2 border-dashed p-4 text-center text-[12px] ${
          isHover ? 'border-sky-400 bg-sky-50' : 'border-slate-300 bg-slate-50/50'
        }`}
      >
        Glissez des photos ici ou utilisez le bouton "Importer".
      </div>

      {/* Grille d'assets */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {st.assets.map((a) => (
          <AssetCard key={a.id} assetId={a.id} />
        ))}
      </div>
    </div>
  );
}

function AssetCard({ assetId }: { assetId: string }) {
  const st = useAlbumStore();
  const asset = st.assets.find((x) => x.id === assetId)!;

  // Est-ce que l'asset est utilisé sur la page courante ?
  const inUse = st.pages[st.currentPageIndex]?.items.some((i) => i.kind === 'photo' && i.assetId === assetId);

  const addToPage = () => {
    // Positionne un cadre 6x4 cm en haut-gauche avec AR de l'image
    const p = st.pages[st.currentPageIndex];
    const id = Math.random().toString(36).slice(2);
    const w = 6;
    const h = asset.ar ? w / asset.ar : 4;
    
    // Convertir cm en pixels (approximation : 1 cm ≈ 37.8 px)
    const pixelRatio = 37.8;
    const ph = {
      id,
      kind: 'photo' as const,
      x: 1 * pixelRatio, // 1 cm converti en pixels
      y: 1 * pixelRatio, // 1 cm converti en pixels
      width: w * pixelRatio, // 6 cm converti en pixels
      height: h * pixelRatio, // hauteur calculée convertie en pixels
      opacity: 1,
      rotation: 0,
      assetId,
    };
    
    p.items.push(ph as any);
    st.selectedItemId = id;
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
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          style={inUse ? { filter: 'grayscale(1) opacity(.7)' } : undefined}
        />
        {/* Bouton + discret (bleu) */}
        <button
          type="button"
          onClick={addToPage}
          title="Ajouter à la page"
          className="absolute bottom-2 right-2 text-[11px] h-7 px-2 rounded-full bg-sky-600 text-white shadow hover:bg-sky-700"
        >
          + Ajouter
        </button>

        {/* Badge "utilisée" */}
        {inUse && (
          <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-white/90 shadow">
            utilisée
          </span>
        )}
      </div>

      <div className="flex items-center justify-between px-2.5 py-2">
        <span className="text-[11px] text-slate-600 truncate">{asset.url.startsWith('blob:') ? 'Fichier local' : 'URL'}</span>
        <button
          type="button"
          onClick={removeAsset}
          className="text-[11px] px-2 py-0.5 rounded-full border border-slate-300 hover:bg-slate-50"
          title="Retirer de la liste"
        >
          Retirer
        </button>
      </div>
    </div>
  );
}