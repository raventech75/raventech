/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { useAlbumStore, ALBUM_SIZES, Background, Page, PhotoItem, TextItem } from '@/store/useAlbumStore';
import { nanoid } from 'nanoid';

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function LeftSidebar() {
  const st = useAlbumStore();

  const page: Page = st.pages[st.currentIndex];
  const selId = st.selectedIds[0] || null;
  const selItem = selId ? (page.items.find((i: any) => i.id === selId) as PhotoItem | TextItem | undefined) : undefined;

  // Helpers sûrs
  const isPhoto = (it: any): it is PhotoItem => it && it.kind === 'photo';
  const isText = (it: any): it is TextItem => it && it.kind === 'text';

  const handleBackground = (bg: Background) => st.setBackground(bg);

  return (
    <aside className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      {/* PAGES */}
      <Section
        title={`Pages (${st.pages.length})`}
        right={
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50 active:scale-[0.98]"
              onClick={() => st.addPage()}
            >
              +
            </button>
            <button
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50 active:scale-[0.98]"
              onClick={() => st.removePage(st.currentIndex)}
            >
              –
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          {st.pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => st.goTo(i)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                i === st.currentIndex
                  ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              Page {i + 1}
              <div className="mt-2 h-14 rounded-lg border border-dashed border-slate-300 bg-slate-50" />
            </button>
          ))}
        </div>
      </Section>

      {/* FORMAT / ZOOM / GUIDES */}
      <Section title="Affichage & format">
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 text-xs text-slate-500">Format</label>
          <select
            className="col-span-2 rounded-lg border border-slate-300 px-2 py-1 text-sm"
            value={st.size.label}
            onChange={(e) => {
              const s = ALBUM_SIZES.find((x) => x.label === e.target.value)!;
              st.setSize(s);
            }}
          >
            {ALBUM_SIZES.map((s) => (
              <option key={s.label} value={s.label}>{s.label} cm</option>
            ))}
          </select>

          <div className="col-span-2 mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Zoom</span>
            <span className="text-xs font-semibold">{Math.round(st.zoom * 100)}%</span>
          </div>
          <input
            type="range" min={10} max={300} step={1}
            value={Math.round(st.zoom * 100)}
            onChange={(e)=> st.setZoom(Number(e.target.value)/100)}
            className="col-span-2"
          />

          <div className="col-span-2 mt-2 grid grid-cols-2 gap-2">
            <button
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
              onClick={() => window.dispatchEvent(new Event('raventech-preview'))}
              title="Aperçu rapide"
            >
              Aperçu
            </button>
            <button
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
              onClick={() => window.dispatchEvent(new Event('raventech-fit'))}
              title="Adapter à l’écran"
            >
              Ajuster
            </button>
          </div>

          <div className="col-span-2 mt-2 grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={st.showGrid} onChange={st.toggleGrid} />
              Grille
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={st.showGuides} onChange={st.toggleGuides} />
              Traits bleed/safe
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={st.snap} onChange={st.toggleSnap} />
              Snap grille
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={st.magnet} onChange={st.toggleMagnet} />
              Aimantation
            </label>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-xs text-slate-500">Grille (px)</div>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                value={st.gridSize}
                onChange={(e)=> st.setGridSize(Math.max(8, Math.floor(Number(e.target.value) || 40)))}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">Tolérance aimant</div>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                value={st.magnetTol}
                onChange={(e)=> st.setMagnetTol(Math.max(1, Math.floor(Number(e.target.value) || 8)))}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* BACKGROUND */}
      <Section title="Arrière-plan">
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`rounded-lg border px-2 py-1 text-sm ${st.background.type==='solid' ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}
            onClick={()=> handleBackground({ type:'solid', color1: (st.background as any).color1 ?? '#ffffff' })}
          >
            Uni
          </button>
          <button
            className={`rounded-lg border px-2 py-1 text-sm ${st.background.type==='linear' ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}
            onClick={()=> handleBackground({ type:'linear', color1:'#ffffff', color2:'#f1f5f9', angleDeg: 0 })}
          >
            Dégradé linéaire
          </button>
          <button
            className={`col-span-2 rounded-lg border px-2 py-1 text-sm ${st.background.type==='radial' ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}
            onClick={()=> handleBackground({ type:'radial', color1:'#ffffff', color2:'#f1f5f9' })}
          >
            Dégradé radial
          </button>

          {/* Couleurs / angle */}
          <div className="col-span-2 mt-2 grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-xs text-slate-500">Couleur 1</div>
              <input
                type="color"
                className="h-9 w-full rounded"
                value={(st.background as any).color1 ?? '#ffffff'}
                onChange={(e)=> {
                  const cur = st.background;
                  if (cur.type === 'solid') handleBackground({ type:'solid', color1: e.target.value });
                  if (cur.type === 'linear') handleBackground({ ...cur, color1: e.target.value });
                  if (cur.type === 'radial') handleBackground({ ...cur, color1: e.target.value });
                }}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">Couleur 2</div>
              <input
                type="color"
                className="h-9 w-full rounded"
                value={(st.background as any).color2 ?? '#f1f5f9'}
                onChange={(e)=> {
                  const cur = st.background;
                  if (cur.type === 'linear') handleBackground({ ...cur, color2: e.target.value });
                  if (cur.type === 'radial') handleBackground({ ...cur, color2: e.target.value });
                }}
                disabled={st.background.type === 'solid'}
              />
            </div>
            <div className="col-span-2">
              <div className="mb-1 text-xs text-slate-500">Angle (linéaire)</div>
              <input
                type="range" min={0} max={360}
                value={(st.background as any).angleDeg ?? 0}
                onChange={(e)=> {
                  const cur = st.background;
                  if (cur.type === 'linear') handleBackground({ ...cur, angleDeg: Number(e.target.value) });
                }}
                disabled={st.background.type !== 'linear'}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* LAYOUTS */}
      <Section title="Layouts">
        <div className="grid grid-cols-2 gap-2">
          <button className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50" onClick={()=> st.autoLayout(1)}>Grille 1</button>
          <button className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50" onClick={()=> st.autoLayout(2)}>Grille 2</button>
          <button className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50" onClick={()=> st.autoLayout(3)}>Grille 3</button>
          <button className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50" onClick={()=> st.autoLayout(4)}>Grille 4</button>

          <button className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50" onClick={()=> st.autoLayoutAuto()}>Auto (√N)</button>
          <button className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50" onClick={()=> st.autoLayoutMosaic()}>Mosaïque</button>

          <button className="col-span-2 rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50" onClick={()=> st.autoFill(3)}>
            Auto-remplir (+range)
          </button>
        </div>
      </Section>

      {/* ITEM SÉLECTIONNÉ : styles/Z-order */}
      <Section title="Élément sélectionné">
        {!selItem && <div className="text-xs text-slate-500">Aucun élément sélectionné.</div>}

        {isPhoto(selItem) && (
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 text-xs text-slate-500">Opacité</div>
            <input
              type="range" min={0.1} max={1} step={0.05}
              value={selItem.opacity ?? 1}
              onChange={(e)=> st.updateItem(page.id, selItem.id, { opacity: parseFloat(e.target.value) })}
              className="col-span-2"
            />

            <div className="col-span-2 mt-2 grid grid-cols-2 gap-2">
              <button
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
                onClick={()=> st.sendToBack(page.id, selItem.id)}
              >
                Envoyer arrière
              </button>
              <button
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
                onClick={()=> st.bringToFront(page.id, selItem.id)}
              >
                Mettre devant
              </button>
            </div>

            <button
              className="col-span-2 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-sm text-rose-700 hover:bg-rose-100"
              onClick={()=> st.deleteItem(page.id, selItem.id)}
            >
              Supprimer
            </button>
          </div>
        )}

        {isText(selItem) && (
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <div className="mb-1 text-xs text-slate-500">Taille</div>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                value={selItem.fontSize}
                onChange={(e)=> st.updateItem(page.id, selItem.id, { fontSize: Math.max(8, Math.floor(Number(e.target.value) || 12)) })}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">Graisse</div>
              <select
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                value={selItem.fontWeight ?? 400}
                onChange={(e)=> st.updateItem(page.id, selItem.id, { fontWeight: Number(e.target.value) })}
              >
                <option value={300}>Light</option>
                <option value={400}>Regular</option>
                <option value={600}>SemiBold</option>
                <option value={700}>Bold</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">Couleur</div>
              <input
                type="color"
                className="h-9 w-full rounded"
                value={selItem.color}
                onChange={(e)=> st.updateItem(page.id, selItem.id, { color: e.target.value })}
              />
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-2">
              <button className={`rounded-lg border px-2 py-1 text-xs ${selItem.align==='left'?'border-indigo-400 bg-indigo-50':'border-slate-300 hover:bg-slate-50'}`} onClick={()=> st.updateItem(page.id, selItem.id, { align:'left' })}>Gauche</button>
              <button className={`rounded-lg border px-2 py-1 text-xs ${selItem.align==='center'?'border-indigo-400 bg-indigo-50':'border-slate-300 hover:bg-slate-50'}`} onClick={()=> st.updateItem(page.id, selItem.id, { align:'center' })}>Centre</button>
              <button className={`rounded-lg border px-2 py-1 text-xs ${selItem.align==='right'?'border-indigo-400 bg-indigo-50':'border-slate-300 hover:bg-slate-50'}`} onClick={()=> st.updateItem(page.id, selItem.id, { align:'right' })}>Droite</button>
            </div>

            <button
              className="col-span-2 mt-2 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-sm text-rose-700 hover:bg-rose-100"
              onClick={()=> st.deleteItem(page.id, selItem.id)}
            >
              Supprimer
            </button>
          </div>
        )}
      </Section>
    </aside>
  );
}