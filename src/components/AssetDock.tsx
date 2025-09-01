/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function AssetDock() {
  const { assets, addAssets } = useAlbumStore();
  const [open, setOpen] = React.useState(true);
  const [filter, setFilter] = React.useState<'all'|'used'|'unused'>('all');

  const list = assets.filter(a => filter==='all' ? true : filter==='used' ? a.used : !a.used);

  return (
    <div className="fixed left-4 bottom-4 z-40 w-[360px] rounded-2xl border border-slate-300 bg-white shadow-xl">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Bibliothèque</span>
          <select className="text-sm border rounded px-2 py-1"
            value={filter}
            onChange={(e)=>setFilter(e.target.value as any)}
          >
            <option value="all">Tous</option>
            <option value="unused">Non utilisés</option>
            <option value="used">Utilisés</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm inline-flex items-center gap-2 cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e)=> e.target.files && addAssets(e.target.files)} />
            <span className="rounded border border-slate-300 bg-white px-2 py-1">+ Importer</span>
          </label>
          <button className="rounded border border-slate-300 bg-white px-2 py-1 text-sm" onClick={()=>setOpen(o=>!o)}>{open?'▼':'▲'}</button>
        </div>
      </div>
      {open && (
        <div className="max-h-[40vh] overflow-auto p-3 grid grid-cols-3 gap-2">
          {list.map((a)=>(
            <div key={a.id} className="relative">
              <img src={a.url} alt={a.name} className="h-24 w-full object-cover rounded" />
              {a.used && <span className="absolute right-1 top-1 rounded bg-emerald-600 text-white text-[10px] px-1">Utilisée</span>}
            </div>
          ))}
          {!list.length && <p className="col-span-full text-xs text-slate-500">Aucune image.</p>}
        </div>
      )}
    </div>
  );
}