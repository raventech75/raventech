'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

const RBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  ...p
}) => (
  <button
    {...p}
    className={
      'h-7 w-7 rounded-full grid place-items-center border border-slate-300 text-slate-700 hover:bg-slate-50 text-[12px] ' +
      className
    }
  />
);

export default function CanvasToolDock() {
  const st = useAlbumStore();

  const pageIndex = st.currentPageIndex;
  const page = st.pages[pageIndex];
  const selectedId = st.selectedItemId;
  const item = React.useMemo(
    () => (selectedId ? page?.items.find((i) => i.id === selectedId) : undefined),
    [page, selectedId]
  );

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const GridToggle = (
    <label className="ml-auto inline-flex items-center gap-2 text-[12px] text-slate-700">
      <input
        type="checkbox"
        checked={st.showGrid}
        onChange={() => st.toggleGrid()}
        className="accent-sky-600"
      />
      Grille
    </label>
  );

  if (!item || item.kind !== 'photo') {
    return (
      <div className="w-full border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-4 py-2 flex items-center gap-2">
          <button
            className="h-8 px-3 rounded-full border border-slate-300 text-[12px] text-slate-700 bg-white hover:bg-slate-50"
            onClick={st.openPreview}
            title="Aperçu des pages"
          >
            Aperçu
          </button>
          <div className="flex-1" />
          {GridToggle}
        </div>
      </div>
    );
  }

  const scale = (item as any).scale ?? 1;
  const setScale = (v: number) =>
    st.updateSelected({ scale: Math.max(0.2, Math.min(3, v)) });

  const feather = Math.max(0, Math.min(40, (item as any).featherPct ?? 0));
  const setFeather = (v: number) =>
    st.updateSelected({ featherPct: Math.max(0, Math.min(40, v)) });

  const opacityPct = Math.round(100 * Math.max(0, Math.min(1, (item as any).opacity ?? 1)));
  const setOpacityPct = (p: number) =>
    st.updateSelected({ opacity: Math.max(0, Math.min(1, p / 100)) });

  const cropActive = !!(item as any).cropActive;

  const rot = item.rot ?? 0;
  const setRot = (deg: number | ((d: number) => number)) => {
    const val = typeof deg === 'function' ? deg(rot) : deg;
    st.updateSelected({ rot: ((val % 360) + 360) % 360 });
  };

  const lockAspect = !!(item as any).lockAspect;
  const toggleLock = () => st.updateSelected({ lockAspect: !lockAspect } as any);

  function applyAspect(ratio: number | null) {
    if (!ratio) return;
    const size = st.size;
    const { x, y, w, h } = item;
    const cx = x + w / 2;
    const cy = y + h / 2;

    let newW = w;
    let newH = w / ratio;
    if (newH > size.h) {
      newH = Math.min(size.h, h);
      newW = newH * ratio;
    }

    let nx = cx - newW / 2;
    let ny = cy - newH / 2;
    nx = Math.max(0, Math.min(size.w - newW, nx));
    ny = Math.max(0, Math.min(size.h - newH, ny));

    st.updateSelected({ x: nx, y: ny, w: newW, h: newH });
  }

  const setOffset = (xPct: number, yPct: number) =>
    st.updateSelected({ offsetXpct: xPct, offsetYpct: yPct } as any);

  return (
    <div className="w-full border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-4 py-2">
        <div className="flex flex-wrap items-center gap-2" onPointerDown={stop} onClick={stop}>
          {/* Aperçu */}
          <button
            className="h-8 px-3 rounded-full border border-slate-300 text-[12px] text-slate-700 bg-white hover:bg-slate-50"
            onClick={st.openPreview}
            title="Aperçu des pages"
          >
            Aperçu
          </button>

          {/* Plan */}
          <div className="flex items-center gap-1">
            <RBtn title="Tout devant" onClick={() => st.bringToFront(pageIndex, item.id)}>⤒</RBtn>
            <RBtn title="Monter d’un plan" onClick={() => st.bringForward(pageIndex, item.id)}>＋</RBtn>
            <RBtn title="Descendre d’un plan" onClick={() => st.sendBackward(pageIndex, item.id)}>－</RBtn>
            <RBtn title="Tout derrière" onClick={() => st.sendToBack(pageIndex, item.id)}>⤓</RBtn>
          </div>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          {/* Zoom interne */}
          <div className="flex items-center gap-1">
            <RBtn title="Zoom −" onClick={() => setScale(scale - 0.1)}>−</RBtn>
            <label className="flex items-center gap-2 text-[12px] text-slate-600">
              <span className="hidden sm:inline">Zoom</span>
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.01}
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-28 sm:w-36 accent-sky-600"
              />
            </label>
            <RBtn title="Zoom +" onClick={() => setScale(scale + 0.1)}>+</RBtn>
            <button
              className="h-7 px-3 rounded-full border border-slate-300 text-[12px] text-slate-700 hover:bg-slate-50"
              title="Remettre à 100%"
              onClick={() => setScale(1)}
            >
              100%
            </button>
          </div>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          {/* Recadrage / ratio */}
          <div className="flex items-center gap-2">
            <button
              className={`h-7 px-3 rounded-full border text-[12px] ${
                cropActive ? 'bg-sky-50 border-sky-300 text-sky-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title="Mode recadrage (Alt+glisser dans l’image, ou glisser directement quand activé)"
              onClick={() => st.updateSelected({ cropActive: !cropActive } as any)}
            >
              {cropActive ? 'Recadrage : ON' : 'Recadrage'}
            </button>

            <select
              className="h-7 rounded-full border border-slate-300 text-[12px] px-2 text-slate-700 bg-white"
              defaultValue="free"
              title="Ratio du cadre"
              onChange={(e) => {
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
              className={`h-7 px-3 rounded-full border text-[12px] ${
                lockAspect ? 'bg-violet-50 border-violet-300 text-violet-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title="Verrouiller le ratio du cadre (redimensionnement proportionnel)"
              onClick={() => toggleLock()}
            >
              Ratio verrouillé
            </button>
          </div>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          {/* Presets offset */}
          <div className="hidden md:flex items-center gap-1" title="Position de l’image dans le cadre">
            <RBtn onClick={() => setOffset(-25, 0)}>←</RBtn>
            <RBtn onClick={() => setOffset(0, 0)}>•</RBtn>
            <RBtn onClick={() => setOffset(25, 0)}>→</RBtn>
            <RBtn onClick={() => setOffset(0, -25)}>↑</RBtn>
            <RBtn onClick={() => setOffset(0, 25)}>↓</RBtn>
          </div>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          {/* Rotation */}
          <div className="flex items-center gap-1" title="Rotation">
            <RBtn onClick={() => setRot((r) => r - 1)}>−1°</RBtn>
            <label className="flex items-center gap-2 text-[12px] text-slate-600">
              <span className="hidden sm:inline">Rot.</span>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={item.rot ?? 0}
                onChange={(e) => setRot(parseInt(e.target.value, 10))}
                className="w-28 sm:w-36 accent-sky-600"
              />
            </label>
            <RBtn onClick={() => setRot((r) => r + 1)}>+1°</RBtn>
            <button
              className="h-7 px-3 rounded-full border border-slate-300 text-[12px] text-slate-700 hover:bg-slate-50"
              onClick={() => setRot(0)}
            >
              0°
            </button>
          </div>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          {/* Fondu */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-600">Fondu</span>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={feather}
              onChange={(e) => setFeather(parseInt(e.target.value, 10))}
              className="w-28 sm:w-36 accent-sky-600"
            />
            <span className="text-[12px] tabular-nums w-10 text-right text-slate-700">
              {feather}%
            </span>
          </div>

          <span className="mx-1 h-5 w-px bg-slate-200" />

          {/* Opacité */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-600">Opacité</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={opacityPct}
              onChange={(e) => setOpacityPct(parseInt(e.target.value, 10))}
              className="w-28 sm:w-36 accent-sky-600"
            />
            <span className="text-[12px] tabular-nums w-10 text-right text-slate-700">
              {opacityPct}%
            </span>
          </div>

          <div className="flex-1" />
          {GridToggle}
        </div>
      </div>
    </div>
  );
}