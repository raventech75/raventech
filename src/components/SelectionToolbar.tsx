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

const RBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...p }) => (
  <button
    {...p}
    className={
      'h-7 px-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-[12px] ' + className
    }
  />
);

export default function SelectionToolbar() {
  const st = useAlbumStore();
  const page = st.pages[st.currentPageIndex];
  const selectedId = (st as any).selectedItemId ?? (st as any).selectedId;

  const item = React.useMemo(() => (selectedId ? page?.items.find((i: any) => i.id === selectedId) : undefined), [page, selectedId]);

  if (!item) {
    return (
      <Bubble style={{ position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)' }}>
        <span className="text-[12px] text-slate-600">Sélectionnez un élément</span>
      </Bubble>
    );
  }

  const isPhoto = (item as any).kind === 'photo';
  const isText = (item as any).kind === 'text';

  const lock = !!(item as any).lock;
  const setLock = (v: boolean) => (st as any).updateSelected?.({ lock: v } as any);

  const ratio =
    isPhoto && (item as any).assetId && st.assets.find((a) => a.id === (item as any).assetId)?.ar
      ? st.assets.find((a) => a.id === (item as any).assetId)!.ar!
      : null;

  const lockAspect = !!(item as any).lockAspect;
  const setLockAspect = (v: boolean) => (st as any).updateSelected?.({ lockAspect: v } as any);

  const rot = (item as any).rotation ?? 0;
  const setRot = (deg: number) => (st as any).updateSelected?.({ rotation: ((deg % 360) + 360) % 360 } as any);

  // ===== Ajuster ratio au cadre (évite l'erreur TS: item peut être undefined) =====
  function applyAspect(r: number | null) {
    if (!r) return; // libre
    const size = st.size;
    // guard: ensure item exists before destructuring
    if (!item) return;
    const { x, y, w, h } = item as any;
    const cx = x + w / 2;
    const cy = y + h / 2;

    let newW = w;
    let newH = w / r;
    if (newH > size.h) {
      newH = Math.min(size.h, h);
      newW = newH * r;
    }

    let nx = cx - newW / 2;
    let ny = cy - newH / 2;
    nx = Math.max(0, Math.min(size.w - newW, nx));
    ny = Math.max(0, Math.min(size.h - newH, ny));

    (st as any).updateSelected?.({
      x: nx,
      y: ny,
      w: newW,
      h: newH,
      lockAspect: true,
    } as any);
  }

  // ===== Décalage de l’image dans le cadre (pour photo) =====
  const setOffset = (dxPct: number, dyPct: number) => {
    if (!isPhoto) return;
    const it = item as any;
    const sx = it.offsetX ?? 0;
    const sy = it.offsetY ?? 0;
    (st as any).updateSelected?.({ offsetX: sx + dxPct, offsetY: sy + dyPct } as any);
  };

  // ===== Flip & alignements =====
  const flipH = () => {
    const sx = (item as any).scaleX ?? 1;
    (st as any).updateSelected?.({ scaleX: -sx } as any);
  };
  const flipV = () => {
    const sy = (item as any).scaleY ?? 1;
    (st as any).updateSelected?.({ scaleY: -sy } as any);
  };

  const align = (how: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const s = st.size;
    const it = item as any;
    let nx = it.x;
    let ny = it.y;

    if (how === 'left') nx = 0;
    if (how === 'center') nx = Math.round((s.w - it.w) / 2);
    if (how === 'right') nx = Math.max(0, s.w - it.w);

    if (how === 'top') ny = 0;
    if (how === 'middle') ny = Math.round((s.h - it.h) / 2);
    if (how === 'bottom') ny = Math.max(0, s.h - it.h);

    (st as any).updateSelected?.({ x: nx, y: ny } as any);
  };

  return (
    <Bubble style={{ position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)' }}>
      {/* Verrou */}
      <button
        onClick={() => setLock(!lock)}
        title={lock ? 'Déverrouiller' : 'Verrouiller'}
        className={
          'h-7 rounded-full border border-slate-300 px-3 text-[12px] ' +
          (lock ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50')
        }
      >
        {lock ? 'Verrouillé' : 'Verrouiller'}
      </button>

      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Ratio */}
      {(isPhoto || isText) && (
        <div className="flex items-center gap-1" title="Ratio du cadre">
          <RBtn onClick={(e) => { e.stopPropagation(); applyAspect(ratio); }}>AR</RBtn>
          <RBtn onClick={(e) => { e.stopPropagation(); applyAspect(1); }}>1:1</RBtn>
          <RBtn onClick={(e) => { e.stopPropagation(); applyAspect(3 / 2); }}>3:2</RBtn>
          <RBtn onClick={(e) => { e.stopPropagation(); applyAspect(4 / 3); }}>4:3</RBtn>
          <RBtn onClick={(e) => { e.stopPropagation(); applyAspect(16 / 9); }}>16:9</RBtn>

          <button
            onClick={(e) => { e.stopPropagation(); setLockAspect(!lockAspect); }}
            title={lockAspect ? 'Déverrouiller ratio' : 'Verrouiller ratio'}
            className={
              'ml-2 h-7 rounded-full border border-slate-300 px-3 text-[12px] ' +
              (lockAspect ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50')
            }
          >
            {lockAspect ? 'Ratio verrouillé' : 'Verrouiller ratio'}
          </button>
        </div>
      )}

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
        <RBtn onClick={(e) => { e.stopPropagation(); setRot(rot + 1); }}>+1°</RBtn>
        <RBtn onClick={(e) => { e.stopPropagation(); setRot(rot - 15); }}>−15°</RBtn>
        <RBtn onClick={(e) => { e.stopPropagation(); setRot(rot + 15); }}>+15°</RBtn>
      </div>

      <span className="mx-1 h-4 w-px bg-slate-200" />

      {/* Miroir */}
      <div className="flex items-center gap-1" title="Miroir (scaleX/scaleY inversés)">
        <RBtn onClick={(e) => { e.stopPropagation(); flipH(); }}>⇋</RBtn>
        <RBtn onClick={(e) => { e.stopPropagation(); flipV(); }}>⇵</RBtn>
      </div>

      {/* (on peut ajouter d'autres outils ici) */}
    </Bubble>
  );
}