'use client';

import { useAlbumStore, ALBUM_SIZES } from '@/store/useAlbumStore';
import { useMemo } from 'react';

export default function LeftSidebar() {
  const st = useAlbumStore();
  const page = st.pages[st.currentIndex];
  const selId = st.selectedIds[0] ?? null;
  const selItem = useMemo(() => page.items.find((i: any) => i.id === selId) as any, [page, selId]);

  const bg = st.background as any;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Taille + Zoom */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Taille de l’album
        </div>
        <select
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          value={st.size.label}
          onChange={(e) => {
            const s = ALBUM_SIZES.find((x) => x.label === e.target.value)!;
            st.setSize(s);
            setTimeout(() => window.dispatchEvent(new CustomEvent('raventech-fit')), 0);
          }}
        >
          {ALBUM_SIZES.map((s) => (
            <option key={s.label} value={s.label}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span>Zoom</span>
          <div className="flex items-center gap-2">
            <button
              className="rounded border border-slate-200 px-2 py-1"
              onClick={() => st.setZoom(Math.max(0.1, st.zoom - 0.05))}
            >
              –
            </button>
            <span className="w-12 text-center tabular-nums">{Math.round(st.zoom * 100)}%</span>
            <button
              className="rounded border border-slate-200 px-2 py-1"
              onClick={() => st.setZoom(Math.min(3, st.zoom + 0.05))}
            >
              +
            </button>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('raventech-fit'))}
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Adapter
        </button>
      </div>

      {/* Auto-layout & Auto-fill */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Mise en page automatique
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4].map((c)=>(
            <button
              key={c}
              onClick={()=>st.autoLayout(c as 1|2|3|4)}
              className="rounded border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
            >
              {c} col
            </button>
          ))}
          <button onClick={()=>st.autoLayoutAuto()} className="col-span-2 rounded border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50">
            Auto
          </button>
          <button onClick={()=>st.autoLayoutMosaic()} className="col-span-2 rounded border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50">
            Mosaïque
          </button>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[1,2,3,4].map((c)=>(
            <button
              key={'fill'+c}
              onClick={()=>st.autoFill(c as 1|2|3|4)}
              className="rounded border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
            >
              Fill {c}
            </button>
          ))}
        </div>
      </div>

      {/* Arrière-plan */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Arrière-plan
        </div>
        <div className="mb-2">
          <select
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={st.background.type}
            onChange={(e) => {
              const t = e.target.value as 'solid'|'linear'|'radial';
              if (t === 'solid') st.setBackground({ type:'solid', color1: bg.color1 ?? '#ffffff' });
              if (t === 'linear') st.setBackground({ type:'linear', color1: bg.color1 ?? '#ffffff', color2: bg.color2 ?? '#f1f5f9', angleDeg: bg.angleDeg ?? 0 });
              if (t === 'radial') st.setBackground({ type:'radial', color1: bg.color1 ?? '#ffffff', color2: bg.color2 ?? '#f1f5f9' });
            }}
          >
            <option value="solid">Uni</option>
            <option value="linear">Dégradé linéaire</option>
            <option value="radial">Dégradé radial</option>
          </select>
        </div>

        {/* Couleurs */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between gap-2 text-sm">
            <span>Couleur 1</span>
            <input
              type="color"
              value={bg.color1 ?? '#ffffff'}
              onChange={(e)=> st.setBackground({ ...(st.background as any), color1: e.target.value })}
            />
          </label>
          {(st.background.type !== 'solid') && (
            <label className="flex items-center justify-between gap-2 text-sm">
              <span>Couleur 2</span>
              <input
                type="color"
                value={bg.color2 ?? '#f1f5f9'}
                onChange={(e)=> st.setBackground({ ...(st.background as any), color2: e.target.value })}
              />
            </label>
          )}
        </div>

        {st.background.type === 'linear' && (
          <label className="mt-2 block text-sm">
            Angle ({bg.angleDeg ?? 0}°)
            <input
              type="range" min={0} max={360} value={bg.angleDeg ?? 0}
              onChange={(e)=> st.setBackground({ ...(st.background as any), angleDeg: parseInt(e.target.value,10) })}
              className="w-full"
            />
          </label>
        )}
      </div>

      {/* Outils élément sélectionné */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Élément sélectionné
        </div>

        {selItem ? (
          <div className="space-y-2 text-sm">
            <div className="text-xs text-slate-500">ID: {selItem.id.slice(0,6)}…</div>

            {/* Opacité (photo uniquement) */}
            {selItem.kind === 'photo' && (
              <label className="block">
                Opacité ({Math.round((selItem.opacity ?? 1)*100)}%)
                <input
                  type="range" min={0.1} max={1} step={0.05}
                  value={selItem.opacity ?? 1}
                  onChange={(e)=>st.updateItem(page.id, selItem.id, { opacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </label>
            )}

            {/* Z-order */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={st.sendToBack} className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50">Tout derrière</button>
              <button onClick={st.bringToFront} className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50">Tout devant</button>
              <button onClick={st.sendBackward} className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50">Arrière</button>
              <button onClick={st.bringForward} className="rounded border border-slate-200 px-2 py-1 hover:bg-slate-50">Avant</button>
            </div>

            <button
              onClick={()=>st.deleteItem(page.id, selItem.id)}
              className="mt-1 w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 hover:bg-rose-100"
            >
              Supprimer
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Aucune sélection.</div>
        )}
      </div>

      {/* Pages empilées */}
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pages ({st.pages.length})
          </div>
          <div className="flex gap-1">
            <button
              className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
              onClick={() => st.addPage()}
              title="Ajouter une page"
            >
              +
            </button>
            <button
              className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
              onClick={() => st.removePage(st.currentIndex)}
              title="Supprimer la page courante"
            >
              −
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {st.pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => st.goTo(i)}
              className={`w-full rounded-lg border p-2 text-left ${
                i === st.currentIndex ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-medium">Page {i + 1}</div>
              <div className="mt-1 h-16 w-full rounded border border-dashed border-slate-300 bg-slate-50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}