'use client';

import React from 'react';
import { useAlbumStore, type Asset } from '@/store/useAlbumStore';

function uid() {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return 'id_' + Math.random().toString(36).slice(2, 10);
}

async function readImage(file: File): Promise<Asset | null> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  return new Promise((resolve) => {
    img.onload = () => {
      const ar = img.width && img.height ? img.width / img.height : undefined;
      // ✅ ne pas inclure "name" (absent du type Asset)
      resolve({ id: uid(), url, ar });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export default function PhotoImport() {
  const st = useAlbumStore();
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onPickFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const promises: Promise<Asset | null>[] = [];
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith('image/')) return;
      promises.push(readImage(f));
    });
    const results = (await Promise.all(promises)).filter(Boolean) as Asset[];
    if (!results.length) return;

    // Compatibilité store : addAssets (batch) ou addAsset (unitaire)
    if (typeof (st as any).addAssets === 'function') {
      (st as any).addAssets(results);
    } else {
      results.forEach((a) => (st as any).addAsset?.(a));
    }
  }

  return (
    <div>
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
    </div>
  );
}