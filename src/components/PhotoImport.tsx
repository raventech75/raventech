'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

type Asset = { id: string; url: string; ar?: number };

function uid() {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID();
  return 'id_' + Math.random().toString(36).slice(2, 10);
}

export default function PhotoImport() {
  const st = useAlbumStore();
  const inputRef = React.useRef<HTMLInputElement>(null);

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
    const tasks: Promise<Asset | null>[] = [];
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith('image/')) return;
      tasks.push(readImage(f));
    });
    const assets = (await Promise.all(tasks)).filter(Boolean) as Asset[];

    // Compat : selon ton store tu peux avoir addAssets OU juste addAsset
    // @ts-expect-error – on supporte les deux signatures
    if (typeof st.addAssets === 'function') st.addAssets(assets);
    else assets.forEach((a) => st.addAsset(a));
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-full px-3 py-1.5 text-[12px] bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
      >
        Importer des images
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onPickFiles(e.target.files)}
      />
    </div>
  );
}