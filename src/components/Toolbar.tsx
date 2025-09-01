/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function Toolbar() {
  const st = useAlbumStore();
  const {
    zoom,setZoom,showGrid,toggleGrid,gridSize,setGridSize,
    showGuides,toggleGuides,snap,toggleSnap,
    magnet, toggleMagnet, magnetTol, setMagnetTol,
    pages,currentIndex,goTo,addPage,removePage,clearPage,
    autoLayout,autoLayoutAuto,autoLayoutMosaic,autoFill,
    tool,setTool,selectedIds,updateItem,deleteItem,addText
  } = st;

  const page = pages[currentIndex];
  const selectedId = selectedIds[0] || null;
  const selectedPhoto = selectedId ? (page.items.find(i=>i.id===selectedId && (i as any).kind==='photo') as any) : null;

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 text-black">
      <div className="font-semibold">RavenTech — Éditeur (Page {currentIndex+1}/{pages.length})</div>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <div className="flex items-center gap-2">
        <button className={`rounded border px-2 py-1 text-sm ${tool==='select'?'border-black':'border-slate-300'}`} onClick={()=>setTool('select')}>Sélection</button>
        <button className={`rounded border px-2 py-1 text-sm ${tool==='photo'?'border-black':'border-slate-300'}`} onClick={()=>setTool('photo')}>Photo</button>
        <button className={`rounded border px-2 py-1 text-sm ${tool==='text'?'border-black':'border-slate-300'}`} onClick={()=>setTool('text')}>Texte</button>
      </div>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <div className="flex items-center gap-2">
        <button className={`rounded border px-2 py-1 text-sm ${showGrid?'border-black':'border-slate-300'}`} onClick={toggleGrid}>Grille</button>
        <label className="text-xs flex items-center gap-1">
          <span>Grille (px)</span>
          <input className="w-16 rounded border border-slate-300 px-2 py-1 text-sm" type="number" min={8} max={200} value={gridSize} onChange={(e)=>setGridSize(parseInt(e.target.value||'0'))}/>
        </label>
        <button className={`rounded border px-2 py-1 text-sm ${showGuides?'border-black':'border-slate-300'}`} onClick={toggleGuides}>Repères</button>
        <button className={`rounded border px-2 py-1 text-sm ${snap?'border-black':'border-slate-300'}`} onClick={toggleSnap}>Snap</button>

        {/* Aimant */}
        <button className={`rounded border px-2 py-1 text-sm ${magnet?'border-black':'border-slate-300'}`} onClick={toggleMagnet}>Aimant</button>
        <label className="text-xs flex items-center gap-1">
          <span>Tol.</span>
          <input className="w-14 rounded border border-slate-300 px-2 py-1 text-sm" type="number" min={1} max={40} value={magnetTol} onChange={(e)=>setMagnetTol(parseInt(e.target.value||'8'))}/>
          <span>px</span>
        </label>

        <button className="rounded border border-slate-300 px-2 py-1 text-sm" onClick={()=>setZoom(zoom-0.1)}>-</button>
        <span className="text-sm w-14 text-center">{Math.round(zoom*100)}%</span>
        <button className="rounded border border-slate-300 px-2 py-1 text-sm" onClick={()=>setZoom(zoom+0.1)}>+</button>
        <button className="rounded border border-slate-300 px-2 py-1 text-sm" onClick={()=>setZoom(1)}>100%</button>
      </div>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <div className="flex items-center gap-2">
        <button className="rounded border border-slate-300 px-2 py-1 text-sm" onClick={()=>addPage()}>+ Page</button>
        <button className="rounded border border-slate-300 px-2 py-1 text-sm" onClick={()=>removePage(currentIndex)}>- Page</button>
        <button className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-sm" onClick={()=>clearPage(page.id)}>Vider</button>
        <select className="rounded border border-slate-300 px-2 py-1 text-sm" value={currentIndex} onChange={(e)=>goTo(parseInt(e.target.value))}>
          {pages.map((p,i)=>(<option key={p.id} value={i}>Page {i+1}</option>))}
        </select>
      </div>

      <div className="mx-1 h-6 w-px bg-slate-200" />

      <div className="flex items-center gap-2">
        <span className="text-xs">Auto-layout:</span>
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>autoLayout(1)}>1</button>
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>autoLayout(2)}>2</button>
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>autoLayout(3)}>3</button>
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>autoLayout(4)}>4</button>
        <button className="rounded border px-2 py-1 text-sm" onClick={autoLayoutAuto}>Auto</button>
        <button className="rounded border px-2 py-1 text-sm" onClick={autoLayoutMosaic}>Mosaïque</button>

        <span className="text-xs ml-2">Auto-fill:</span>
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>autoFill(1)}>1</button>
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>autoFill(2)}>2</button>
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>autoFill(3)}>3</button>
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>autoFill(4)}>4</button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>addText(40,40,'Titre de page')}>+ Texte</button>
        <button className="rounded border px-2 py-1 text-sm" onClick={()=>window.dispatchEvent(new Event('raventech-preview'))}>👁️ Aperçu</button>

        {selectedPhoto && (
          <>
            <span className="text-xs ml-2">Opacité</span>
            <input
              type="range" min={10} max={100}
              value={Math.round((selectedPhoto.opacity ?? 1)*100)}
              onChange={(e)=>updateItem(page.id, selectedPhoto.id, { opacity: Number(e.target.value)/100 })}
            />
            <button className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-sm" onClick={()=>deleteItem(page.id, selectedPhoto.id)}>Supprimer la photo</button>
          </>
        )}
      </div>
    </header>
  );
}