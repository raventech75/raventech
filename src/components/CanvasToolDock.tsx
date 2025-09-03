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

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-slate-600">{children}</div>;
}

type Pos = { x: number; y: number } | null;

export default function CanvasToolDock() {
  const st = useAlbumStore();

  const pageIndex = st.currentPageIndex;
  const page = st.pages[pageIndex];

  // Id unique sélectionné (si dispo dans le store)
  const selectedId: string | undefined = (st as any).selectedItemId ?? (st as any).selectedId;

  // Liste d'IDs sélectionnés (fallback si le store n'a pas selectedIds)
  const selectedIds: string[] = React.useMemo(() => {
    const fromStore = (st as any).selectedIds as string[] | undefined;
    if (Array.isArray(fromStore)) return fromStore;
    const alt = (st as any).selected as string[] | undefined;
    if (Array.isArray(alt)) return alt;
    if (selectedId) return [selectedId];
    return [];
  }, [st, selectedId]);

  const item = React.useMemo(
    () => (selectedId ? page?.items.find((i) => i.id === selectedId) : undefined),
    [page, selectedId]
  );

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const GridToggle = (
    <label className="ml-auto inline-flex items-center gap-2 text-[12px] text-slate-700">
      <input
        type="checkbox"
        checked={(st as any).showGrid ?? false}
        onChange={() => (st as any).toggleGrid?.()}
        className="h-4 w-4"
      />
      <span>Grille</span>
    </label>
  );

  /* =========================
     Position draggable + persistance
     ========================= */
  const [pos, setPos] = React.useState<Pos>(null); // null => centré par défaut
  const dragRef = React.useRef<{
    start?: { x: number; y: number };
    base?: { x: number; y: number };
    dragging: boolean;
  }>({ dragging: false });

  // Charger la position
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('canvasToolDockPos');
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.x === 'number' && typeof p?.y === 'number') setPos({ x: p.x, y: p.y });
      }
    } catch {}
  }, []);

  // Sauvegarder la position
  React.useEffect(() => {
    if (!pos) return;
    try {
      localStorage.setItem('canvasToolDockPos', JSON.stringify(pos));
    } catch {}
  }, [pos]);

  // Contrainte dans la fenêtre
  const clampToViewport = React.useCallback((x: number, y: number) => {
    const m = 8; // marge
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Estimation largeur/hauteur dock (≈) pour clamp
    const W = 920; // largeur max approximative
    const H = 48;
    return {
      x: Math.min(Math.max(m, x), Math.max(m, vw - m - 200)), // laisse de la marge à droite
      y: Math.min(Math.max(m, y), Math.max(m, vh - m - H)),
    };
  }, []);

  // Démarrage drag sur la poignée
  const onHandlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current.dragging = true;
    dragRef.current.start = { x: e.clientX, y: e.clientY };
    const base = pos ?? {
      // si pos null => centré haut
      x: Math.round(window.innerWidth / 2 - 460), // W≈920 /2
      y: 16,
    };
    dragRef.current.base = base;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onHandlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging || !dragRef.current.start || !dragRef.current.base) return;
    const dx = e.clientX - dragRef.current.start.x;
    const dy = e.clientY - dragRef.current.start.y;
    const nx = dragRef.current.base.x + dx;
    const ny = dragRef.current.base.y + dy;
    const cl = clampToViewport(nx, ny);
    setPos(cl);
  };

  const onHandlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    dragRef.current.start = undefined;
    dragRef.current.base = undefined;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const onHandleDoubleClick = () => {
    // reset position => centré haut
    setPos(null);
    try {
      localStorage.removeItem('canvasToolDockPos');
    } catch {}
  };

  // Style absolu selon pos
  const dockWrapperStyle: React.CSSProperties = pos
    ? {
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        zIndex: 40,
      }
    : {
        position: 'absolute',
        left: '50%',
        top: 16,
        transform: 'translateX(-50%)',
        zIndex: 40,
      };

  if (!item) {
    return (
      <div
        className="pointer-events-auto"
        style={dockWrapperStyle}
        onPointerDown={stop}
        onPointerMove={stop}
      >
        <div className="flex items-center gap-3 rounded-full border border-slate-300 bg-white/95 px-3 py-2 shadow">
          {/* poignée draggable */}
          <button
            title="Déplacer la barre (double-clic pour réinitialiser)"
            onDoubleClick={onHandleDoubleClick}
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            className="h-7 w-7 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-[12px] cursor-grab active:cursor-grabbing"
            aria-label="Drag handle"
          >
            ⋮⋮
          </button>

          <Label>Sélectionnez un élément</Label>
          {GridToggle}
        </div>
      </div>
    );
  }

  const isPhoto = (item as any).kind === 'photo';
  const isText = (item as any).kind === 'text';
  const lock = !!(item as any).lock;
  const toggleLock = () => (st as any).updateSelected?.({ lock: !lock } as any);

  const ratio =
    isPhoto && (item as any).assetId && st.assets.find((a) => a.id === (item as any).assetId)?.ar
      ? st.assets.find((a) => a.id === (item as any).assetId)!.ar!
      : null;

  const lockAspect = !!(item as any).lockAspect;
  const toggleLockAspect = () => (st as any).updateSelected?.({ lockAspect: !lockAspect } as any);

  const rotate = (deg: number) => {
    (st as any).updateSelected?.({
      rotation: (((item as any).rotation || 0) + deg) % 360,
    } as any);
  };

  const flipH = () => {
    const sx = (item as any).scaleX ?? 1;
    (st as any).updateSelected?.({ scaleX: -sx } as any);
  };

  const flipV = () => {
    const sy = (item as any).scaleY ?? 1;
    (st as any).updateSelected?.({ scaleY: -sy } as any);
  };

  function applyAspect(r: number | null) {
    if (!r) return;
    const size = st.size;
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

  const distribute = (axis: 'h' | 'v') => {
    const items = page.items.filter((i: any) => selectedIds.includes(i.id));
    if (!items || items.length < 3) return;

    const sorted =
      axis === 'h' ? [...items].sort((a, b) => a.x - b.x) : [...items].sort((a, b) => a.y - b.y);

    const totalSpan =
      axis === 'h'
        ? (sorted[sorted.length - 1].x + sorted[sorted.length - 1].w) - sorted[0].x
        : (sorted[sorted.length - 1].y + sorted[sorted.length - 1].h) - sorted[0].y;

    const occupied =
      axis === 'h'
        ? sorted.reduce((acc, i) => acc + i.w, 0)
        : sorted.reduce((acc, i) => acc + i.h, 0);

    const gaps = sorted.length - 1;
    const space = Math.max(0, totalSpan - occupied);
    const gapSize = Math.floor(space / gaps);

    let cursor = axis === 'h' ? sorted[0].x + sorted[0].w : sorted[0].y + sorted[0].h;
    for (let i = 1; i < sorted.length - 1; i++) {
      if (axis === 'h') {
        sorted[i].x = cursor + gapSize;
        cursor = sorted[i].x + sorted[i].w;
      } else {
        sorted[i].y = cursor + gapSize;
        cursor = sorted[i].y + sorted[i].h;
      }
    }
    (st as any).touch?.();
  };

  const nudge = (dx: number, dy: number) => {
    const it = item as any;
    (st as any).updateSelected?.({ x: it.x + dx, y: it.y + dy } as any);
  };

  const duplicate = () => {
    const it = item as any;
    const id =
      typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : 'id_' + Math.random().toString(36).slice(2, 10);

    const copy = { ...it, id, x: it.x + 10, y: it.y + 10 };
    page.items.push(copy);
    (st as any).setSelected?.([id]);
    (st as any).touch?.();
  };

  const remove = () => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!ids.length) return;
    page.items = page.items.filter((i: any) => !ids.includes(i.id));
    (st as any).setSelected?.([]);
    (st as any).touch?.();
  };

  return (
    <div
      className="pointer-events-auto"
      style={dockWrapperStyle}
      onMouseDown={stop}
      onPointerDown={stop}
    >
      <div className="flex items-center gap-3 rounded-full border border-slate-300 bg-white/95 px-3 py-2 shadow">
        {/* poignée draggable */}
        <button
          title="Déplacer la barre (double-clic pour réinitialiser)"
          onDoubleClick={onHandleDoubleClick}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          className="h-7 w-7 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-[12px] cursor-grab active:cursor-grabbing"
          aria-label="Drag handle"
        >
          ⋮⋮
        </button>

        {/* Verrou */}
        <button
          onClick={toggleLock}
          title={lock ? 'Déverrouiller' : 'Verrouiller'}
          className={
            'h-7 rounded-full border border-slate-300 px-3 text-[12px] ' +
            (lock ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50')
          }
        >
          {lock ? 'Verrouillé' : 'Verrouiller'}
        </button>

        {/* Alignements */}
        <div className="flex items-center gap-1">
          <Label>Aligner</Label>
          <RBtn onClick={() => align('left')} title="Gauche">⟸</RBtn>
          <RBtn onClick={() => align('center')} title="Centre">━</RBtn>
          <RBtn onClick={() => align('right')} title="Droite">⟹</RBtn>
          <RBtn onClick={() => align('top')} title="Haut">⟰</RBtn>
          <RBtn onClick={() => align('middle')} title="Milieu">┃</RBtn>
          <RBtn onClick={() => align('bottom')} title="Bas">⟱</RBtn>
        </div>

        {/* Distribution */}
        <div className="flex items-center gap-1">
          <Label>Distribuer</Label>
          <RBtn onClick={() => distribute('h')} title="Horizontal">≋</RBtn>
          <RBtn onClick={() => distribute('v')} title="Vertical">║</RBtn>
        </div>

        {/* Déplacement fin */}
        <div className="flex items-center gap-1">
          <Label>Déplacer</Label>
          <RBtn onClick={() => nudge(-1, 0)} title="Gauche">←</RBtn>
          <RBtn onClick={() => nudge(1, 0)} title="Droite">→</RBtn>
          <RBtn onClick={() => nudge(0, -1)} title="Haut">↑</RBtn>
          <RBtn onClick={() => nudge(0, 1)} title="Bas">↓</RBtn>
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-1">
          <Label>Rotation</Label>
          <RBtn onClick={() => rotate(-90)} title="-90°">⟲</RBtn>
          <RBtn onClick={() => rotate(90)} title="+90°">⟳</RBtn>
        </div>

        {/* Miroir */}
        <div className="flex items-center gap-1">
          <Label>Miroir</Label>
          <RBtn onClick={flipH} title="Horizontal">⇋</RBtn>
          <RBtn onClick={flipV} title="Vertical">⇵</RBtn>
        </div>

        {/* Ratio / verrouillage */}
        {(isPhoto || isText) && (
          <div className="flex items-center gap-1">
            <Label>Ratio</Label>
            <RBtn onClick={() => applyAspect(ratio)} title="Ratio image">AR</RBtn>
            <RBtn onClick={() => applyAspect(1)} title="1:1">1:1</RBtn>
            <RBtn onClick={() => applyAspect(3 / 2)} title="3:2">3:2</RBtn>
            <RBtn onClick={() => applyAspect(4 / 3)} title="4:3">4:3</RBtn>
            <RBtn onClick={() => applyAspect(16 / 9)} title="16:9">16:9</RBtn>

            <button
              onClick={toggleLockAspect}
              title={lockAspect ? 'Déverrouiller ratio' : 'Verrouiller ratio'}
              className={
                'ml-2 h-7 rounded-full border border-slate-300 px-3 text-[12px] ' +
                (lockAspect ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50')
              }
            >
              {lockAspect ? 'Verrouiller ratio' : 'Verrouiller ratio'}
            </button>
          </div>
        )}

        {GridToggle}
      </div>
    </div>
  );
}