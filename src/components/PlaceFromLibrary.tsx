/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function PlaceFromLibrary() {
  const { assets, placePhotoAuto, cmToPx, size, addAssets } = useAlbumStore();
  const [filter, setFilter] = React.useState<'all'|'unused'|'used'>('all');
  const [query, setQuery] = React.useState('');

  const list = assets.filter(a=>{
    if (filter==='unused' && a.used) return false;
    if (filter==='used' && !a.used) return false;
    if (query && !a.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const areaW = cmToPx(size.w*2);
  const defaultW = Math.max(120, Math.round(areaW / 3)); // base raisonnable

  return (
    <aside className="h-full w-[300px] border-l border-slate-300 bg-white p-4 overflow-y-auto text-black">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Bibliothèque</h3>
        <select className="text-sm border rounded px-2 py-1" value={filter} onChange={(e)=>setFilter(e.target.value as any)}>
          <option value="all">Tous</option>
          <option value="unused">Non utilisés</option>
          <option value="used">Utilisés</option>
        </select>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          placeholder="Rechercher…"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
        />
        <label className="text-sm inline-flex items-center gap-2 cursor-pointer">
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e)=> e.target.files && addAssets(e.target.files)} />
          <span className="rounded border border-slate-300 bg-white px-2 py-1">+ Importer</span>
        </label>
      </div>

      <p className="mt-2 text-xs text-slate-600">{list.length} / {assets.length} images</p>

      <div className="mt-3 grid grid-cols-1 gap-3">
        {list.map((a)=>(
          <button
            key={a.id}
            className="group relative overflow-hidden rounded-xl border border-slate-300 text-left"
            onClick={()=> placePhotoAuto(a.id, defaultW)}  // ⬅️ placement auto sans chevauchement
            title={a.name}
          >
            <img src={a.url} alt={a.name} className="h-36 w-full object-cover" />
            <div className="p-2">
              <div className="text-sm font-medium truncate">{a.name}</div>
              <div className="text-[11px] text-slate-500">
                {a.w}×{a.h}px {a.used && <span className="ml-1 rounded bg-emerald-600 px-1 text-white">Utilisée</span>}
              </div>
            </div>
          </button>
        ))}
        {!list.length && <p className="text-xs text-slate-500">Aucune image.</p>}
      </div>
    </aside>
  );
}