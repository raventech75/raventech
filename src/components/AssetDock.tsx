'use client';

import * as React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function AssetDock() {
  const st = useAlbumStore();

  return (
    <div className="flex gap-2 overflow-x-auto p-2 border-t border-slate-200 bg-slate-50">
      {st.assets.map((a) => (
        <button
          key={a.id}
          className="shrink-0 w-20 h-20 rounded-md border border-slate-200 overflow-hidden bg-white hover:shadow-sm"
          // ✅ fallback si pas de "name"
          title={a.url.split('/').pop() || 'image'}
          onClick={() => {
            const pg = st.pages[st.currentPageIndex];
            if (!pg) return;
            st.addPhotoAutoPack(a.id);
          }}
        >
          {/* Preview si disponible, sinon l’image principale */}
          <img
            src={a.previewUrl || a.url}
            alt="asset"
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}