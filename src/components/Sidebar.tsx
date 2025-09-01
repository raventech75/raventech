/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React from 'react';
import { useAlbumStore, ALBUM_SIZES } from '@/store/useAlbumStore';

export default function Sidebar() {
  const st = useAlbumStore();
  const {
    size, setSize, pageCount, setPageCount,
    gridSize, setGridSize, bleedMm, setBleedMm, safeMm, setSafeMm,
    background, setBackground, pages, currentIndex, updateItem, selectedIds
  } = st;

  const selectedId = selectedIds[0] || null;
  const selectedText = selectedId ? (pages[currentIndex].items.find(i => i.id===selectedId && (i as any).kind==='text') as any) : null;

  return (
    <aside className="h-full w-full max-w-[320px] border-r border-slate-300 bg-white p-4 overflow-y-auto text-black">
      <h3 className="text-sm font-semibold">Paramètres</h3>

      <div className="mt-4">
        <label className="block text-xs text-slate-600">Format (album fermé)</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ALBUM_SIZES.map((s) => (
            <button
              key={s.label}
              className={`rounded border px-3 py-2 text-sm ${size.label===s.label ? 'border-black bg-slate-100' : 'border-slate-300'}`}
              onClick={()=>setSize(s)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-600">Double page = <b>{size.w*2} × {size.h} cm</b></p>
      </div>

      <div className="mt-6">
        <label className="block text-xs text-slate-600">Nombre de pages (max 25)</label>
        <input type="range" min={2} max={25} value={pageCount} onChange={(e)=>setPageCount(parseInt(e.target.value))} className="w-full" />
        <p className="text-sm mt-1">{pageCount} pages</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-600">Grille (px)</label>
          <input type="number" value={gridSize} onChange={(e)=>setGridSize(parseInt(e.target.value||'0'))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs text-slate-600">Bleed (mm)</label>
          <input type="number" value={bleedMm} onChange={(e)=>setBleedMm(parseInt(e.target.value||'0'))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs text-slate-600">Safe (mm)</label>
          <input type="number" value={safeMm} onChange={(e)=>setSafeMm(parseInt(e.target.value||'0'))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold">Fond / Fondus (page)</h4>
        <div className="mt-2 space-y-2">
          <select
            value={background.type}
            onChange={(e)=>{
              const t = e.target.value as any;
              if (t==='solid') setBackground({ type: 'solid', color1: '#ffffff' });
              if (t==='linear') setBackground({ type: 'linear', color1: '#ffffff', color2: '#e5e7eb', angleDeg: 0 });
              if (t==='radial') setBackground({ type: 'radial', color1: '#ffffff', color2: '#e5e7eb' });
            }}
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="solid">Couleur unie</option>
            <option value="linear">Dégradé linéaire</option>
            <option value="radial">Dégradé radial</option>
          </select>

          {background.type === 'solid' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Couleur</label>
              <input type="color" value={background.color1} onChange={(e)=>setBackground({ type: 'solid', color1: e.target.value })} />
            </div>
          )}

          {background.type === 'linear' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600">Couleur A</label>
                <input type="color" value={background.color1} onChange={(e)=>setBackground({ ...(background as any), color1: e.target.value })} />
                <label className="text-xs text-slate-600">Couleur B</label>
                <input type="color" value={(background as any).color2} onChange={(e)=>setBackground({ ...(background as any), color2: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600">Angle</label>
                <input type="number" value={(background as any).angleDeg} onChange={(e)=>setBackground({ ...(background as any), angleDeg: parseInt(e.target.value||'0') })} className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" />
                <span className="text-xs">°</span>
              </div>
            </>
          )}

          {background.type === 'radial' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Centre</label>
              <input type="color" value={background.color1} onChange={(e)=>setBackground({ type: 'radial', color1: e.target.value, color2: (background as any).color2 })} />
              <label className="text-xs text-slate-600">Bord</label>
              <input type="color" value={(background as any).color2} onChange={(e)=>setBackground({ type: 'radial', color1: background.color1, color2: e.target.value })} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold">Texte (sélection)</h4>
        {!selectedText && <p className="text-xs text-slate-500">Sélectionnez un texte pour éditer son style.</p>}
        {selectedText && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600">Police</label>
                <select
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  value={selectedText.fontFamily}
                  onChange={(e)=>updateItem(pages[currentIndex].id, selectedText.id, { fontFamily: e.target.value })}
                >
                  <option>Inter, system-ui, sans-serif</option>
                  <option>Libre Baskerville, serif</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600">Graisse</label>
                <select
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  value={selectedText.fontWeight}
                  onChange={(e)=>updateItem(pages[currentIndex].id, selectedText.id, { fontWeight: e.target.value as any })}
                >
                  <option value="300">Light</option>
                  <option value="400">Regular</option>
                  <option value="600">Semibold</option>
                  <option value="800">ExtraBold</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-slate-600">Taille</label>
                <input type="number" className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  value={selectedText.fontSize}
                  onChange={(e)=>updateItem(pages[currentIndex].id, selectedText.id, { fontSize: parseInt(e.target.value||'0') })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600">Interl.</label>
                <input type="number" step="0.1" className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  value={selectedText.lineHeight}
                  onChange={(e)=>updateItem(pages[currentIndex].id, selectedText.id, { lineHeight: parseFloat(e.target.value||'1') })}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600">Esp. lettres</label>
                <input type="number" className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  value={selectedText.letterSpacing}
                  onChange={(e)=>updateItem(pages[currentIndex].id, selectedText.id, { letterSpacing: parseFloat(e.target.value||'0') })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Couleur</label>
              <input type="color" value={selectedText.color} onChange={(e)=>updateItem(pages[currentIndex].id, selectedText.id, { color: e.target.value })} />
              <div className="ml-auto flex items-center gap-1">
                <button className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={()=>updateItem(pages[currentIndex].id, selectedText.id, { align:'left' })}>G</button>
                <button className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={()=>updateItem(pages[currentIndex].id, selectedText.id, { align:'center' })}>C</button>
                <button className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={()=>updateItem(pages[currentIndex].id, selectedText.id, { align:'right' })}>D</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}