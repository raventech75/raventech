'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

// Bulle flottante
const Bubble: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    className="rounded-full bg-white/95 backdrop-blur border border-slate-200 shadow-lg px-2 py-1 flex items-center gap-2"
    style={{ ...style, pointerEvents: 'auto' }}
  >
    {children}
  </div>
);

// Petit bouton rond
const RBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...p }) => (
  <button
    {...p}
    className={
      'h-6 w-6 rounded-full grid place-items-center border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] ' +
      className
    }
  />
);

export default function SelectionToolbar() {
  const st = useAlbumStore();

  const pageIndex = st.currentPageIndex;
  const page = st.pages[pageIndex];
  const selectedId = st.selectedItemId;
  const item = React.useMemo(
    () => (selectedId ? page?.items.find((i) => i.id === selectedId) : undefined),
    [page, selectedId]
  );
  if (!item || item.kind !== 'photo') return null;

  // Position flottante
  const pxPerCm = (96 / 2.54) * st.zoom;
  const leftPx = item.x * pxPerCm;
  const topPx  = item.y * pxPerCm;
  const wPx    = item.w * pxPerCm;
  const bubbleW = Math.min(420, Math.max(280, wPx));
  const bubbleX = Math.max(8, Math.min(leftPx + wPx / 2 - bubbleW / 2, st.size.w * pxPerCm - bubbleW - 8));
  const bubbleYAbove = topPx - 46;
  const bubbleYBelow = topPx + item.h * pxPerCm + 8;
  const bubbleY = bubbleYAbove < 4 ? bubbleYBelow : bubbleYAbove;

  // États & mutateurs
  const scale = (item as any).scale ?? 1;
  const setScale = (v: number) => st.updateSelected({ scale: Math.max(0.2, Math.min(3, v)) });

  const feather = Math.max(0, Math.min(40, (item as any).featherPct ?? 0));
  const setFeather = (v: number) => st.updateSelected({ featherPct: Math.max(0, Math.min(40, v)) });

  const opacityPct = Math.round(100 * Math.max(0, Math.min(1, (item as any).opacity ?? 1)));
  const setOpacityPct = (p: number) => st.updateSelected({ opacity: Math.max(0, Math.min(1, p / 100)) });

  const cropActive = !!(item as any).cropActive;

  // Rotation
  const rot = item.rot ?? 0;
  const setRot = (deg: number) => st.updateSelected({ rot: ((deg % 360) + 360) % 360 });

  // Verrou ratio (persiste sur l’item, utilisé par EditorCanvas)
  const lockAspect = !!(item as any).lockAspect;
  const toggleLock = () => st.updateSelected({ lockAspect: !lockAspect } as any);

  // Appliquer un ratio (réajuste le CADRE autour du centre)
  function applyAspect(ratio: number | null) {
    if (!ratio) return; // libre
    const size = st.size;
    const { x, y, w, h } = item;
    const cx = x + w / 2;
    const cy = y + h / 2;

    let newW = w;
    let newH = w / ratio;
    if (newH > size.h) { newH = Math.min(size.h, h); newW = newH * ratio; }

    let nx = cx - newW / 2;
    let ny = cy - newH / 2;
    nx = Math.max(0, Math.min(size.w - newW, nx));
    ny = Math.max(0, Math.min(size.h - newH, ny));

    st.updateSelected({ x: nx, y: ny, w: newW, h: newH });
  }

  // Presets recadrage (déplace l’image à l’intérieur du cadre)
  const setOffset = (xPct: number, yPct: number) =>
    st.updateSelected({ offsetXpct: xPct, offsetYpct: yPct } as any);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      className="absolute inset-0 z-[50]"
      style={{ pointerEvents: 'none' }}
      onPointerDown={stop}
      onPointerUp={stop}
      onClick={stop}
      onMouseDown={stop}
      onMouseUp={stop}
      onDoubleClick={stop}
    >
      <Bubble style={{ position: 'absolute', left: bubbleX, top: bubbleY, width: bubbleW }}>
        {/* Plan */}
        <div className="flex items-center gap-1">
          <RBtn title="Tout devant" onClick={(e) => { e.stopPropagation(); st.bringToFront(pageIndex, item.id); }}>⤒</RBtn>
          <RBtn title="Monter d’un plan" onClick={(e) => { e.stopPropagation(); st.bringForward(pageIndex, item.id); }}>＋</RBtn>
          <RBtn title="Descendre d’un plan" onClick={(e) => { e.stopPropagation(); st.sendBackward(pageIndex, item.id); }}>－</RBtn>
          <RBtn title="Tout derrière" onClick={(e) => { e.stopPropagation(); st.sendToBack(pageIndex, item.id); }}>⤓</RBtn>
        </div>

        <span className="mx-1 h-4 w-px bg-slate-200" />

        {/* Zoom interne */}
        <div className="flex items-center gap-1">
          <RBtn title="Zoom −" onClick={(e) => { e.stopPropagation(); setScale(scale - 0.1); }}>−</RBtn>
          <label className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="hidden sm:inline">Zoom</span>
            <input
              type="range"
              min={0.2} max={3} step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-24 sm:w-28 accent-sky-600"
              onPointerDown={stop}
            />
          </label>
          <RBtn title="Zoom +" onClick={(e) => { e.stopPropagation(); setScale(scale + 0.1); }}>+</RBtn>
          <button
            className="h-6 px-2 rounded-full border border-slate-300 text-[11px] text-slate-700 hover:bg-slate-50"
            title="Remettre à 100%"
            onClick={(e) => { e.stopPropagation(); setScale(1); }}
          >
            100%
          </button>
        </div>

        <span className="mx-1 h-4 w-px bg-slate-200" />

        {/* Recadrage */}
        <div className="flex items-center gap-2">
          <button
            className={`h-6 px-2 rounded-full border text-[11px] ${cropActive ? 'bg-sky-50 border-sky-300 text-sky-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            title="Mode recadrage (glisser pour déplacer l’image dans le cadre)"
            onClick={(e) => { e.stopPropagation(); st.updateSelected({ cropActive: !cropActive } as any); }}
          >
            {cropActive ? 'Recadrage : ON' : 'Recadrage'}
          </button>

          <select
            className="h-6 rounded-full border border-slate-300 text-[12px] px-2 text-slate-700 bg-white"
            title="Ratio du cadre"
            defaultValue="free"
            onChange={(e) => {
              e.stopPropagation();
              const v = e.target.value;
              if (v === 'free') return;
              const [a, b] = v.split(':').map(Number);
              if (a > 0 && b > 0) applyAspect(a / b);
            }}
          >
            <option value="free">Ratio : Libre</option>
            <option value="1:1">1:1</option>
            <option value="3:2">3:2</option>
            <option value="2:3">2:3</option>
            <option value="4:3">4:3</option>
            <option value="16:9">16:9</option>
          </select>

          <button
            className={`h-6 px-2 rounded-full border text-[11px] ${lockAspect ? 'bg-violet-50 border-violet-300 text-violet-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            title="Verrouiller le ratio du cadre (redimensionnement proportionnel)"
            onClick={(e) => { e.stopPropagation(); toggleLock(); }}
          >
            Ratio verrouillé
          </button>
        </div>

        <span className="mx-1 h-4 w-px bg-slate-200" />

        {/* Presets recadrage */}
        <div className="hidden sm:flex items-center gap-1" title="Position de l’image dans le cadre">
          <RBtn onClick={(e) => { e.stopPropagation(); setOffset(-25, 0); }}>←</RBtn>
          <RBtn onClick={(e) => { e.stopPropagation(); setOffset(0, 0); }}>•</RBtn>
          <RBtn onClick={(e) => { e.stopPropagation(); setOffset(25, 0); }}>→</RBtn>
          <RBtn onClick={(e) => { e.stopPropagation(); setOffset(0, -25); }}>↑</RBtn>
          <RBtn onClick={(e) => { e.stopPropagation(); setOffset(0, 25); }}>↓</RBtn>
        </div>

        <span className="mx-1 h-4 w-px bg-slate-200" />

        {/* Rotation */}
        <div className="flex items-center gap-1" title="Rotation du cadre (et de l’image)">
          <RBtn onClick={(e) => { e.stopPropagation(); setRot(rot - 1); }}>−1°</RBtn>
          <label className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="hidden sm:inline">Rot.</span>
            <input
              type="range" min={0} max={360} step={1}
              value={rot}
              onChange={(e) => setRot(parseInt(e.target.value, 10))}
              className="w-24 sm:w-28 accent-sky-600"
              onPointerDown={stop}
            />
          </label>
          <RBtn onClick={(e) => { e.stopPropagation(); setRot(rot + 1); }}>+1°</RBtn>
          <button
            className="h-6 px-2 rounded-full border border-slate-300 text-[11px] text-slate-700 hover:bg-slate-50"
            onClick={(e) => { e.stopPropagation(); setRot(0); }}
            title="Remettre à 0°"
          >
            0°
          </button>
        </div>

        <span className="mx-1 h-4 w-px bg-slate-200" />

        {/* Fondu */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">Fondu</span>
          <input
            type="range"
            min={0} max={40} step={1}
            value={feather}
            onChange={(e) => setFeather(parseInt(e.target.value, 10))}
            className="w-24 sm:w-28 accent-sky-600"
            onPointerDown={stop}
          />
          <span className="text-[11px] tabular-nums w-10 text-right text-slate-700">{feather}%</span>
        </div>

        <span className="mx-1 h-4 w-px bg-slate-200" />

        {/* Opacité */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">Opacité</span>
          <input
            type="range"
            min={0} max={100} step={1}
            value={opacityPct}
            onChange={(e) => setOpacityPct(parseInt(e.target.value, 10))}
            className="w-24 sm:w-28 accent-sky-600"
            onPointerDown={stop}
          />
          <span className="text-[11px] tabular-nums w-10 text-right text-slate-700">{opacityPct}%</span>
        </div>
      </Bubble>
    </div>
  );
}