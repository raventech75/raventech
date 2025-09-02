'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

const cmToPx = (cm: number) => (cm / 2.54) * 96;

/* ===== util bruit ===== */
function makeNoiseDataURL(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

type DragState = {
  id: string | null;
  mode:
    | 'move'
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'topleft'
    | 'topright'
    | 'bottomleft'
    | 'bottomright'
    | 'corner'
    | 'inner-pan'
    | null;
  originPx: { x: number; y: number } | null;
  startBoxCm: { x: number; y: number; w: number; h: number } | null;
  keepRatio: boolean;
  lockAxis: 'x' | 'y' | null;
  startOffsetPct?: { x: number; y: number } | null;
};

type SnapLines = { v: number[]; h: number[] };
type PinchState = {
  itemId: string | null;
  pointers: Map<number, { x: number; y: number }>;
  lastDist?: number;
};

/* ===== Règles / guides / grille / snap (helpers visuels) ===== */
function TopRuler({ widthPx, zoom }: { widthPx: number; zoom: number }) {
  const cmPx = cmToPx(1) * zoom;
  const marks = Math.max(0, Math.ceil(widthPx / cmPx));
  return (
    <div className="absolute select-none" style={{ top: -26, left: 0, width: widthPx, height: 26, background: 'linear-gradient(#f8fafc, #eef2f7)', borderBottom: '1px solid #cbd5e1', borderLeft: '1px solid #cbd5e1', boxShadow: '0 1px 0 rgba(0,0,0,.04) inset', zIndex: 10 }}>
      {Array.from({ length: marks + 1 }).map((_, i) => {
        const x = i * cmPx, major = i % 5 === 0;
        return (
          <div key={i} style={{ position: 'absolute', left: x }}>
            <div style={{ position: 'absolute', bottom: 0, width: 0, borderLeft: '1px solid #94a3b8', height: major ? 16 : 10, opacity: major ? 1 : 0.9 }} />
            {major && i !== 0 && (<span style={{ position: 'absolute', bottom: 16, left: 2, fontSize: 10, color: '#475569' }}>{i}</span>)}
          </div>
        );
      })}
    </div>
  );
}
function LeftRuler({ heightPx, zoom }: { heightPx: number; zoom: number }) {
  const cmPx = cmToPx(1) * zoom;
  const marks = Math.max(0, Math.ceil(heightPx / cmPx));
  return (
    <div className="absolute select-none" style={{ top: 0, left: -26, width: 26, height: heightPx, background: 'linear-gradient(90deg, #f8fafc, #eef2f7)', borderRight: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1', boxShadow: '1px 0 0 rgba(0,0,0,.04) inset', zIndex: 10 }}>
      {Array.from({ length: marks + 1 }).map((_, i) => {
        const y = i * cmPx, major = i % 5 === 0;
        return (
          <div key={i} style={{ position: 'absolute', top: y }}>
            <div style={{ position: 'absolute', left: 0, height: 0, borderTop: '1px solid #94a3b8', width: major ? 16 : 10, opacity: major ? 1 : 0.9 }} />
            {major && i !== 0 && (<span style={{ position: 'absolute', left: 16, top: -6, fontSize: 10, color: '#475569' }}>{i}</span>)}
          </div>
        );
      })}
    </div>
  );
}
function GuideV({ x, strong = false }: { x: number; strong?: boolean }) {
  return <div style={{ position: 'absolute', left: x, top: 0, bottom: 0, width: 0, borderLeft: strong ? '2px dashed rgba(124,58,237,.9)' : '1px dashed rgba(59,130,246,.7)' }} />;
}
function GuideH({ y, strong = false }: { y: number; strong?: boolean }) {
  return <div style={{ position: 'absolute', top: y, left: 0, right: 0, height: 0, borderTop: strong ? '2px dashed rgba(124,58,237,.9)' : '1px dashed rgba(59,130,246,.7)' }} />;
}
function SnapV({ x }: { x: number }) { return <div style={{ position: 'absolute', left: x, top: 0, bottom: 0, width: 0, borderLeft: '1px solid #22c55e' }} />; }
function SnapH({ y }: { y: number }) { return <div style={{ position: 'absolute', top: y, left: 0, right: 0, height: 0, borderTop: '1px solid #22c55e' }} />; }

function GridOverlay({ zoom }: { zoom: number }) {
  const cm = (1 / 2.54) * 96 * zoom;
  const cm5 = cm * 5;
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px),
          linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)
        `,
        backgroundSize: `${cm}px ${cm}px, ${cm}px ${cm}px, ${cm5}px ${cm5}px, ${cm5}px ${cm5}px`,
        imageRendering: 'crisp-edges',
        mixBlendMode: 'multiply',
      }}
    />
  );
}

function Grip({ className, dir }: { className: string; dir:
  'left'|'right'|'top'|'bottom'|'topleft'|'topright'|'bottomleft'|'bottomright'|'corner'
}) {
  return (
    <div
      className={`absolute w-3.5 h-3.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.15)] border border-slate-300
                  hover:scale-125 transition-transform ${className}`}
      data-grip={dir}
    />
  );
}

/* HUD de dimensions pendant le resize */
function SizeHUD({
  x, y, w, h, dpi, zoom,
}: { x: number; y: number; w: number; h: number; dpi: number; zoom: number }) {
  const pxW = Math.round((w / 2.54) * dpi);
  const pxH = Math.round((h / 2.54) * dpi);
  const left = cmToPx(x) * zoom;
  const top  = cmToPx(y) * zoom;

  return (
    <div
      className="pointer-events-none absolute text-[11px]"
      style={{
        left: left,
        top: Math.max(0, top - 26),
        transform: 'translateX(-50%)',
      }}
    >
      <div className="px-2 py-1 rounded-md bg-black/65 text-white shadow">
        {w.toFixed(2)}×{h.toFixed(2)} cm · {pxW}×{pxH}px
      </div>
    </div>
  );
}

export default function EditorCanvas() {
  const refWrap = React.useRef<HTMLDivElement>(null);
  const refStage = React.useRef<HTMLDivElement>(null);

  const st = useAlbumStore();
  const { size, zoom, panPx } = st;
  const page = st.pages[st.currentPageIndex] ?? null;

  const noiseUrlRef = React.useRef<string | null>(null);
  if (!noiseUrlRef.current && typeof window !== 'undefined') {
    try { noiseUrlRef.current = makeNoiseDataURL(64); } catch {}
  }

  // ===== Auto-fit (montage + resize + changement de format) =====
  React.useEffect(() => {
    const doFit = () => {
      const wrap = refWrap.current;
      if (!wrap) return;
      st.fitToWindow({ w: wrap.clientWidth, h: wrap.clientHeight - 16 });
    };
    requestAnimationFrame(doFit);
    const ro = new ResizeObserver(() => requestAnimationFrame(doFit));
    if (refWrap.current) ro.observe(refWrap.current);
    const onSizeChanged = () => requestAnimationFrame(doFit);
    const onZoomFit = () => requestAnimationFrame(doFit);
    window.addEventListener('album:size-changed', onSizeChanged);
    window.addEventListener('album:zoom-fit', onZoomFit);
    return () => {
      ro.disconnect();
      window.removeEventListener('album:size-changed', onSizeChanged);
      window.removeEventListener('album:zoom-fit', onZoomFit);
    };
  }, [st.fitToWindow]);

  /* ===== Zoom GLOBAL (Cmd + molette). Alt = zoom interne image (géré plus bas) ===== */
  const onWheelStage = (e: React.WheelEvent) => {
    if (e.altKey) return;                // Alt = zoom interne image
    if (e.ctrlKey && !e.metaKey) return; // pinch trackpad -> ignoré
    if (!e.metaKey) return;

    e.preventDefault();
    e.stopPropagation();

    const wrap = refWrap.current;
    const stage = refStage.current;
    if (!wrap || !stage) return;

    const wrapRect = wrap.getBoundingClientRect();
    const pointerX = e.clientX - wrapRect.left;
    const pointerY = e.clientY - wrapRect.top;

    const pageLeft = panPx.x + (wrap.clientWidth - stage.offsetWidth) / 2;
    const pageTop  = panPx.y + (wrap.clientHeight - stage.offsetHeight) / 2;

    const localXBefore = (pointerX - pageLeft) / st.zoom;
    const localYBefore = (pointerY - pageTop)  / st.zoom;

    const factor  = Math.pow(1.05, -Math.sign(e.deltaY));
    const newZoom = Math.max(0.05, Math.min(6, st.zoom * factor));
    st.setZoom(newZoom);

    const stageWNew = cmToPx(size.w) * newZoom;
    const stageHNew = cmToPx(size.h) * newZoom;

    const newPageLeft = pointerX - localXBefore * newZoom;
    const newPageTop  = pointerY - localYBefore * newZoom;

    const centerOffsetX = (wrap.clientWidth - stageWNew) / 2;
    const centerOffsetY = (wrap.clientHeight - stageHNew) / 2;

    st.setPan({ x: newPageLeft - centerOffsetX, y: newPageTop - centerOffsetY });
  };

  /* ===== PAN (Espace / clic milieu) ===== */
  const [isPanKey, setIsPanKey] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);
  const panOrigin = React.useRef<{ x: number; y: number } | null>(null);
  const panStart  = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') setIsPanKey(true); };
    const onKeyUp   = (e: KeyboardEvent) => { if (e.code === 'Space') setIsPanKey(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  const onPointerDownPan = (e: React.PointerEvent) => {
    if (!(isPanKey || e.button === 1)) return;
    e.preventDefault();
    panOrigin.current = { x: e.clientX, y: e.clientY };
    panStart.current  = { ...st.panPx };
    setIsPanning(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMovePan = (e: React.PointerEvent) => {
    if (!isPanning || !panOrigin.current) return;
    const dx = e.clientX - panOrigin.current.x;
    const dy = e.clientY - panOrigin.current.y;
    st.setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  };
  const onPointerUpPan = () => {
    if (!isPanning) return;
    setIsPanning(false);
    panOrigin.current = null;
  };

  /* ===== Drag / Resize + snapping ===== */
  const drag = React.useRef<DragState>({ id: null, mode: null, originPx: null, startBoxCm: null, keepRatio: false, lockAxis: null, startOffsetPct: null });
  const [snapLines, setSnapLines] = React.useState<SnapLines>({ v: [], h: [] });
  const SNAP_THRESHOLD_CM = React.useMemo(() => (st.snapDistancePx / (96 * st.zoom)) * 2.54, [st.snapDistancePx, st.zoom]);

  const itemEdgesCm = React.useCallback((excludeId?: string) => {
    if (!page) return { v: [] as number[], h: [] as number[] };
    const v: number[] = [0, size.w, size.w / 2];
    const h: number[] = [0, size.h, size.h / 2];
    if (st.showGuides) {
      const m = st.marginsCm;
      v.push(m.left, size.w - m.right);
      h.push(m.top, size.h - m.bottom);
    }
    for (const it of page.items) {
      if (excludeId && it.id === excludeId) continue;
      v.push(it.x, it.x + it.w, it.x + it.w / 2);
      h.push(it.y, it.y + it.h, it.y + it.h / 2);
    }
    return { v, h };
  }, [page, size.w, size.h, st.showGuides, st.marginsCm]);

  function snapMoveBox(start: { x: number; y: number; w: number; h: number }, dxCm: number, dyCm: number, id: string) {
    let x = start.x + dxCm, y = start.y + dyCm;
    if (!st.snapEnabled) return { x, y, lines: { v: [], h: [] } };
    const { v, h } = itemEdgesCm(id);
    const candV = [x, x + start.w / 2, x + start.w];
    const candH = [y, y + start.h / 2, y + start.h];
    let bestV: { c: number; t: number; d: number } | null = null;
    let bestH: { c: number; t: number; d: number } | null = null;
    for (const t of v) for (const c of candV) { const d = Math.abs(c - t); if (d <= SNAP_THRESHOLD_CM && (!bestV || d < bestV.d)) bestV = { c, t, d }; }
    for (const t of h) for (const c of candH) { const d = Math.abs(c - t); if (d <= SNAP_THRESHOLD_CM && (!bestH || d < bestH.d)) bestH = { c, t, d }; }
    if (bestV) x += (bestV.t - bestV.c);
    if (bestH) y += (bestH.t - bestH.c);
    return {
      x, y,
      lines: {
        v: bestV ? [cmToPx(bestV.t) * st.zoom + st.panPx.x] : [],
        h: bestH ? [cmToPx(bestH.t) * st.zoom + st.panPx.y] : [],
      }
    };
  }

  function snapResizeBoxAllSides(
    start: { x: number; y: number; w: number; h: number },
    mode:
      | 'left' | 'right' | 'top' | 'bottom'
      | 'topleft' | 'topright' | 'bottomleft' | 'bottomright',
    dxCm: number,
    dyCm: number,
    id: string,
    keepRatio: boolean,
    fromCenter: boolean
  ) {
    let { x, y, w, h } = start;
    const ratio = w / h || 1;

    let nx = x, ny = y, nw = w, nh = h;

    const affectLeft   = mode.includes('left');
    const affectRight  = mode.includes('right') || mode === 'right';
    const affectTop    = mode.includes('top');
    const affectBottom = mode.includes('bottom') || mode === 'bottom';

    let dL = affectLeft   ? -dxCm : 0;
    let dR = affectRight  ?  dxCm : 0;
    let dT = affectTop    ? -dyCm : 0;
    let dB = affectBottom ?  dyCm : 0;

    nx = x + (affectLeft ? -dL : 0);
    ny = y + (affectTop  ? -dT : 0);
    nw = w + dL + dR;
    nh = h + dT + dB;

    if (keepRatio) {
      const byW = nw / ratio;
      const byH = nh * ratio;
      const fixByWidth = Math.abs(nh - byW) > Math.abs(nw - byH);
      if (fixByWidth) {
        const newH = nw / ratio;
        const deltaH = newH - nh;
        if (affectTop && !affectBottom) ny -= deltaH;
        else if (affectBottom && !affectTop) { /* ny inchangé */ }
        else ny -= deltaH / 2;
        nh = newH;
      } else {
        const newW = nh * ratio;
        const deltaW = newW - nw;
        if (affectLeft && !affectRight) nx -= deltaW;
        else if (affectRight && !affectLeft) { /* nx inchangé */ }
        else nx -= deltaW / 2;
        nw = newW;
      }
    }

    if (!st.snapEnabled) {
      return { x: nx, y: ny, w: Math.max(1, nw), h: Math.max(1, nh), lines: { v: [], h: [] } };
    }

    const { v, h: H } = itemEdgesCm(id);

    let left   = nx;
    let right  = nx + nw;
    let top    = ny;
    let bottom = ny + nh;

    const trySnap = (cands: number[], targets: number[]) => {
      let best: { c: number; t: number; d: number } | null = null;
      for (const t of targets) {
        for (const c of cands) {
          const d = Math.abs(c - t);
          if (d <= SNAP_THRESHOLD_CM && (!best || d < best.d)) best = { c, t, d };
        }
      }
      return best;
    };

    let vLines: number[] = [];
    const snapV = trySnap([left, (left + right) / 2, right], v);
    if (snapV) {
      const delta = snapV.t - snapV.c;
      if (snapV.c === left) {
        left += delta; right += fromCenter ? -delta : delta;
      } else if (snapV.c === right) {
        right += delta; left += fromCenter ? -delta : delta;
      } else {
        left += delta; right += delta;
      }
      vLines = [cmToPx(snapV.t) * st.zoom + st.panPx.x];
    }

    let hLines: number[] = [];
    const snapH = trySnap([top, (top + bottom) / 2, bottom], H);
    if (snapH) {
      const delta = snapH.t - snapH.c;
      if (snapH.c === top) {
        top += delta; bottom += fromCenter ? -delta : delta;
      } else if (snapH.c === bottom) {
        bottom += delta; top += fromCenter ? -delta : delta;
      } else {
        top += delta; bottom += delta;
      }
      hLines = [cmToPx(snapH.t) * st.zoom + st.panPx.y];
    }

    nx = left;
    ny = top;
    nw = Math.max(1, right - left);
    nh = Math.max(1, bottom - top);

    return { x: nx, y: ny, w: nw, h: nh, lines: { v: vLines, h: hLines } };
  }

  /* ===== Pinch tactile (zoom interne) ===== */
  const pinchRef = React.useRef<PinchState>({ itemId: null, pointers: new Map() });

  const handleItemPointerDown = (e: React.PointerEvent, itemId: string) => {
    if (isPanKey || e.button === 1) return;

    st.selectItem(st.currentPageIndex, itemId);
    const target = e.currentTarget as HTMLElement;
    const grip = (e.target as HTMLElement).dataset.grip as DragState['mode'] | undefined;

    const startBox = {
      x: parseFloat(target.dataset.xcm!), y: parseFloat(target.dataset.ycm!),
      w: parseFloat(target.dataset.wcm!), h: parseFloat(target.dataset.hcm!),
    };

    const current = st.pages[st.currentPageIndex].items.find(i => i.id === itemId);
    const wantInnerPan = !!current && current.kind === 'photo' && ((current as any).cropActive || e.altKey || e.metaKey);

    drag.current = {
      id: itemId,
      mode: wantInnerPan ? 'inner-pan' : (grip ?? 'move'),
      originPx: { x: e.clientX, y: e.clientY },
      startBoxCm: startBox,
      keepRatio: e.shiftKey || !!(current as any)?.lockAspect,
      lockAxis: null,
      startOffsetPct: wantInnerPan ? { x: (current as any)?.offsetXpct ?? 0, y: (current as any)?.offsetYpct ?? 0 } : null,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (e.pointerType === 'touch') {
      const pr = pinchRef.current;
      if (pr.itemId && pr.itemId !== itemId) { pr.pointers.clear(); pr.lastDist = undefined; }
      pr.itemId = itemId;
      pr.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  };

  const handleItemPointerMove = (e: React.PointerEvent, itId: string) => {
    if (e.pointerType === 'touch') {
      const pr = pinchRef.current;
      if (pr.itemId === itId && pr.pointers.has(e.pointerId)) {
        pr.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pr.pointers.size === 2) {
          const pts = Array.from(pr.pointers.values());
          const dx = pts[0].x - pts[1].x;
          const dy = pts[0].y - pts[1].y;
          const dist = Math.hypot(dx, dy);
          if (!pr.lastDist) pr.lastDist = dist;
          else {
            const delta = dist / pr.lastDist;
            pr.lastDist = dist;
            const item = st.pages[st.currentPageIndex].items.find(i => i.id === itId);
            if (item) {
              const next = Math.max(0.2, Math.min(3, ((item as any).scale ?? 1) * delta));
              st.updateItem(st.currentPageIndex, itId, { scale: next } as any);
            }
          }
        }
      }
    }
  };

  const handleItemPointerUp = (e: React.PointerEvent, itId: string) => {
    if (e.pointerType === 'touch') {
      const pr = pinchRef.current;
      if (pr.itemId === itId) {
        pr.pointers.delete(e.pointerId);
        if (pr.pointers.size < 2) pr.lastDist = undefined;
        if (pr.pointers.size === 0) { pr.itemId = null; }
      }
    }
  };

  const onPointerMoveStage = (e: React.PointerEvent) => {
    if (isPanning) return;
    const d = drag.current;
    if (!d.id || !d.originPx || !d.startBoxCm || !page) return;

    // Pan interne (recadrage)
    if (d.mode === 'inner-pan') {
      const it = page.items.find((x) => x.id === d.id);
      if (!it || it.kind !== 'photo') return;

      const dxPx = e.clientX - d.originPx.x;
      const dyPx = e.clientY - d.originPx.y;

      const pxPerCm = 96 * st.zoom / 2.54;
      const boxWpx = (d.startBoxCm.w) * pxPerCm;
      const boxHpx = (d.startBoxCm.h) * pxPerCm;

      const ratioX = boxWpx > 0 ? (dxPx / boxWpx) * 100 : 0;
      const ratioY = boxHpx > 0 ? (dyPx / boxHpx) * 100 : 0;

      const ox = (d.startOffsetPct?.x ?? 0) + ratioX;
      const oy = (d.startOffsetPct?.y ?? 0) + ratioY;

      const clampedX = Math.max(-100, Math.min(100, ox));
      const clampedY = Math.max(-100, Math.min(100, oy));

      st.updateItem(st.currentPageIndex, it.id, { offsetXpct: clampedX, offsetYpct: clampedY } as any);
      return;
    }

    const dxPx = e.clientX - d.originPx.x, dyPx = e.clientY - d.originPx.y;
    if (d.mode === 'move' && e.shiftKey) d.lockAxis ??= Math.abs(dxPx) > Math.abs(dyPx) ? 'y' : 'x';
    else d.lockAxis = null;

    const dxCm = (dxPx / (96 * st.zoom)) * 2.54;
    const dyCm = (dyPx / (96 * st.zoom)) * 2.54;

    const it = page.items.find((x) => x.id === d.id);
    if (!it) return;

    if (d.mode === 'move') {
      const res = snapMoveBox(d.startBoxCm, dxCm, dyCm, d.id);
      const x = Math.max(0, Math.min(size.w - it.w, res.x));
      const y = Math.max(0, Math.min(size.h - it.h, res.y));
      st.updateItem(st.currentPageIndex, it.id, { x, y }); setSnapLines(res.lines); return;
    }

    if (d.mode && d.mode !== 'inner-pan') {
      const fromCenter = (e.altKey || e.metaKey); // ⌥/⌘ = resize depuis le centre
      const res = snapResizeBoxAllSides(d.startBoxCm, d.mode, dxCm, dyCm, d.id, d.keepRatio, fromCenter);

      const minW = Math.max(it.minW ?? 1, 0.5);
      const minH = Math.max(it.minH ?? 1, 0.5);

      let nx = Math.max(0, Math.min(size.w - minW, res.x));
      let ny = Math.max(0, Math.min(size.h - minH, res.y));
      let nw = Math.max(minW, Math.min(size.w - nx, res.w));
      let nh = Math.max(minH, Math.min(size.h - ny, res.h));

      st.updateItem(st.currentPageIndex, it.id, { x: nx, y: ny, w: nw, h: nh });
      setSnapLines(res.lines);
      return;
    }
  };

  const onPointerUpStage = () => {
    drag.current = { id: null, mode: null, originPx: null, startBoxCm: null, keepRatio: false, lockAxis: null, startOffsetPct: null };
    setSnapLines({ v: [], h: [] });
    st.relayoutCurrentPage();
  };

  /* ===== Raccourcis ===== */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ae = document.activeElement as HTMLElement | null;
        if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
        const id = st.selectedItemId; if (!id) return;
        st.replaceItems(st.currentPageIndex, st.pages[st.currentPageIndex].items.filter(i => i.id !== id));
        st.selectItem(st.currentPageIndex, undefined);
      }

      const id = st.selectedItemId;
      const item = id ? st.pages[st.currentPageIndex].items.find((i) => i.id === id) : undefined;
      if (item && item.kind === 'photo') {
        const inc = () => st.updateSelected({ scale: Math.min(3, ((item as any).scale ?? 1) + 0.1) });
        const dec = () => st.updateSelected({ scale: Math.max(0.2, ((item as any).scale ?? 1) - 0.1) });
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) { e.preventDefault(); inc(); }
        if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); dec(); }
        if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); st.updateSelected({ scale: 1 } as any); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [st]);

  /* ----------------- Rendu ----------------- */
  if (!page) {
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-sm text-slate-500">Aucune page à afficher.</div>
      </div>
    );
  }

  const stageW = cmToPx(size.w) * zoom;
  const stageH = cmToPx(size.h) * zoom;

  const bg = page.background;
  let cssBackground = '#FFFFFF';
  if (bg.kind === 'solid' && (bg as any).solid) cssBackground = (bg as any).solid.color;
  else if (bg.kind === 'linear' && (bg as any).linear) cssBackground = `linear-gradient(${(bg as any).linear.angle}deg, ${(bg as any).linear.from}, ${(bg as any).linear.to})`;
  else if (bg.kind === 'radial' && (bg as any).radial) cssBackground = `radial-gradient(${(bg as any).radial.shape}, ${(bg as any).radial.inner}, ${(bg as any).radial.outer})`;

  const pageStyle: React.CSSProperties = {
    width: stageW,
    height: stageH,
    background: cssBackground,
    boxShadow: '0 0 0 1px rgba(0,0,0,.06), 0 10px 30px rgba(0,0,0,.06)',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  };

  const panTransform: React.CSSProperties = { transform: `translate(${panPx.x}px, ${panPx.y}px)` };

  // Overlays de fond
  const textureLayer = (() => {
    const t = (bg as any).texture;
    if (!t || t.type === 'none' || t.opacity <= 0) return null;
    let backgroundImage = '';
    if (t.type === 'grid') {
      backgroundImage = `
        repeating-linear-gradient(to right, rgba(0,0,0,0.06) 0 1px, transparent 1px 24px),
        repeating-linear-gradient(to bottom, rgba(0,0,0,0.06) 0 1px, transparent 1px 24px)
      `;
    } else if (t.type === 'paper') {
      backgroundImage = `
        repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0 2px, transparent 2px 6px),
        repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0 2px, transparent 2px 6px)
      `;
    } else if (t.type === 'linen') {
      backgroundImage = `
        repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 3px),
        repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 3px)
      `;
    }
    return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: Math.max(0, Math.min(1, t.opacity)), backgroundImage }} />;
  })();

  const noiseLayer = (() => {
    const n = (bg as any).noise;
    if (!n?.enabled || (n.opacity ?? 0) <= 0 || !noiseUrlRef.current) return null;
    return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: Math.max(0, Math.min(1, n.opacity)), backgroundImage: `url(${noiseUrlRef.current})`, backgroundRepeat: 'repeat', mixBlendMode: 'multiply' }} />;
  })();

  const imageLayer = (() => {
    const im = (bg as any).image;
    if (!(bg.kind === 'image' && im && (im.assetId || im.url))) return null;
    const asset = im.assetId ? st.assets.find((a) => a.id === im.assetId) : undefined;
    const url = asset?.url || im.url!;
    const fit = im.fit ?? 'cover';
    return (
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `url(${url})`,
          backgroundPosition: `${50 + (im.offsetX ?? 0)}% ${50 + (im.offsetY ?? 0)}%`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: fit === 'cover' ? `${(im.scale ?? 1) * 100}% auto, cover` : 'contain',
          opacity: im.opacity ?? 1,
          transform: 'translateZ(0)',
        }}
      />
    );
  })();

  const vignetteLayer = (() => {
    const v = (bg as any).vignette;
    if (!v?.enabled) return null;
    const alpha = 0.7 * Math.max(0, Math.min(1, v.strength));
    return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,${alpha}) 100%)` }} />;
  })();

  const textLayer = (() => {
    if (!(bg.kind === 'text' && (bg as any).text && (bg as any).text.content.trim())) return null;
    const t = (bg as any).text;
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
        <div style={{ color: t.color, opacity: t.opacity, fontFamily: t.font || 'serif', fontWeight: 700, transform: `rotate(${t.rotation}deg)`, fontSize: `${(t.sizePct / 100) * stageW}px`, lineHeight: 1, whiteSpace: 'pre-wrap', textAlign: 'center' }}>
          {t.content}
        </div>
      </div>
    );
  })();

  return (
    <div className="h-full w-full flex flex-col">
      {/* Zone Canvas */}
      <div
        ref={refWrap}
        className="flex-1 min-h-[320px] relative overflow-hidden bg-slate-50 flex items-center justify-center"
        onPointerDown={onPointerDownPan}
        onPointerMove={onPointerMovePan}
        onPointerUp={onPointerUpPan}
        style={{ cursor: isPanning || isPanKey ? 'grab' : 'default' }}
      >
        <div className="relative" style={panTransform}>
          {st.showRulers && (
            <>
              <TopRuler widthPx={stageW} zoom={zoom} />
              <LeftRuler heightPx={stageH} zoom={zoom} />
              <div
                className="absolute"
                style={{
                  top: -26, left: -26, width: 26, height: 26,
                  background: 'linear-gradient(135deg, #e5e7eb 25%, #fff 25%, #fff 50%, #e5e7eb 50%, #e5e7eb 75%, #fff 75%, #fff 100%)',
                  backgroundSize: '8px 8px',
                  borderRight: '1px solid #cbd5e1',
                  borderBottom: '1px solid #cbd5e1',
                  borderTopLeftRadius: 8,
                }}
              />
            </>
          )}

          {/* Page */}
          <div
            ref={refStage}
            style={pageStyle}
            onPointerMove={onPointerMoveStage}
            onPointerUp={onPointerUpStage}
            onWheel={onWheelStage}
            onPointerDown={(e) => { if (e.currentTarget === e.target) st.selectItem(st.currentPageIndex, undefined); }}
          >
            {/* couches de fond */}
            {imageLayer}
            {textureLayer}
            {textLayer}
            {vignetteLayer}
            {noiseLayer}

            {/* Guides & snap */}
            {st.showGuides && (
              <>
                <GuideV x={st.marginsCm.left * cmToPx(1) * zoom} />
                <GuideV x={(size.w - st.marginsCm.right) * cmToPx(1) * zoom} />
                <GuideH y={st.marginsCm.top * cmToPx(1) * zoom} />
                <GuideH y={(size.h - st.marginsCm.bottom) * cmToPx(1) * zoom} />
                <GuideV x={(size.w / 2) * cmToPx(1) * zoom} strong />
                <GuideH y={(size.h / 2) * cmToPx(1) * zoom} strong />
              </>
            )}
            {snapLines.v.map((x, i) => <SnapV key={'v'+i} x={x} />)}
            {snapLines.h.map((y, i) => <SnapH key={'h'+i} y={y} />)}

            {/* Grille (option) */}
            {st.showGrid && <GridOverlay zoom={zoom} />}

            {/* Items */}
            {([...page.items].sort((a,b)=>(a.z??0)-(b.z??0)) ?? []).map((it) => {
              const px = cmToPx(1) * zoom;
              const isSelected = st.selectedItemId === it.id;

              const radius =
                it.borderRadiusMode === 'circle' ? '50%' :
                it.borderRadiusMode === 'squircle' ? '30% / 40%' :
                `${Math.max(0, Math.min(50, it.borderRadiusPct ?? 0))}%`;

              const boxShadow =
                it.shadow === 'soft' ? '0 4px 18px rgba(0,0,0,.14)' :
                it.shadow === 'heavy' ? '0 10px 30px rgba(0,0,0,.22)' :
                'none';

              const feather = Math.max(0, Math.min(40, (it as any).featherPct ?? 0));
              const maskImage = feather > 0 ? `radial-gradient(ellipse at center, black ${100 - feather}%, transparent 100%)` : undefined;

              const style: React.CSSProperties = {
                position: 'absolute',
                left: it.x * px, top: it.y * px,
                width: it.w * px, height: it.h * px,
                transform: `rotate(${it.rot ?? 0}deg)`,
                transformOrigin: 'center',
                overflow: 'hidden',
                borderRadius: radius,
                boxShadow,
                border: (it.strokeWidth ?? 0) > 0 ? `${it.strokeWidth}px solid ${it.strokeColor ?? '#000'}` : undefined,
                userSelect: 'none',
                touchAction: 'none',
                cursor: isPanKey ? 'grab' : 'default',
                opacity: (it as any).opacity ?? 1,
                WebkitMaskImage: maskImage as any,
                maskImage: maskImage as any,
              };

              const asset = it.kind === 'photo' && it.assetId ? st.assets.find(a => a.id === it.assetId) : undefined;
              const cropOn = isSelected && (it as any).cropActive;

              return (
                <div
                  key={it.id}
                  style={style}
                  data-xcm={it.x} data-ycm={it.y} data-wcm={it.w} data-hcm={it.h}
                  onPointerDown={(e) => handleItemPointerDown(e, it.id)}
                  onPointerMove={(e) => handleItemPointerMove(e, it.id)}
                  onPointerUp={(e) => handleItemPointerUp(e, it.id)}
                  onPointerCancel={(e) => handleItemPointerUp(e, it.id)}
                  onWheel={(e) => {
                    if (!e.altKey) return; // Alt = zoom interne de l'image
                    if (it.kind !== 'photo') return;
                    e.preventDefault();
                    e.stopPropagation();
                    const cur = (it as any).scale ?? 1;
                    const factor = Math.pow(1.05, -Math.sign(e.deltaY));
                    const next = Math.max(0.2, Math.min(3, cur * factor));
                    st.updateItem(st.currentPageIndex, it.id, { scale: next } as any);
                  }}
                >
                  {it.kind === 'photo' ? (
                    asset ? (
                      <img
                        src={(asset as any).previewUrl ?? asset.url}
                        alt=""
                        draggable={false}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        style={{
                          transform: `translate(${(it as any).offsetXpct ?? 0}%, ${(it as any).offsetYpct ?? 0}%) scale(${(it as any).scale ?? 1})`,
                          transformOrigin: 'center',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[11px] text-slate-500">Image manquante</div>
                    )
                  ) : it.kind === 'text' ? (
                    <div className="p-3 text-slate-800 text-[13px] leading-snug">{it.text}</div>
                  ) : null}

                  {/* Overlay recadrage 3×3 si actif */}
                  {cropOn && (
                    <div className="absolute inset-0 pointer-events-none"
                         style={{ background: 'linear-gradient(rgba(0,0,0,0.22), rgba(0,0,0,0.22))', mixBlendMode: 'multiply' }}>
                      <div className="absolute inset-2 rounded-[inherit] bg-transparent ring-2 ring-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)_inset]">
                        <div className="absolute inset-0">
                          <div className="absolute inset-y-0 left-1/3 w-px bg-white/80" />
                          <div className="absolute inset-y-0 left-2/3 w-px bg-white/80" />
                          <div className="absolute inset-x-0 top-1/3 h-px bg-white/80" />
                          <div className="absolute inset-x-0 top-2/3 h-px bg-white/80" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grips (8 directions) */}
                  <Grip className="left-0 top-1/2 -translate-y-1/2 cursor-ew-resize" dir="left" />
                  <Grip className="right-0 top-1/2 -translate-y-1/2 cursor-ew-resize" dir="right" />
                  <Grip className="top-0 left-1/2 -translate-x-1/2 cursor-ns-resize" dir="top" />
                  <Grip className="bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize" dir="bottom" />

                  <Grip className="left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" dir="topleft" />
                  <Grip className="right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" dir="topright" />
                  <Grip className="left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" dir="bottomleft" />
                  <Grip className="right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" dir="bottomright" />

                  {/* sélection (double ring) */}
                  {isSelected && (
                    <>
                      <div className="pointer-events-none absolute inset-0 ring-2 ring-sky-500/70 rounded-[inherit]" />
                      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/60 rounded-[inherit]" />
                    </>
                  )}
                </div>
              );
            })}

            {/* Size HUD while resizing */}
            {drag.current.id && drag.current.startBoxCm && (() => {
              const it = page.items.find(i => i.id === drag.current!.id);
              if (!it) return null;
              return (
                <SizeHUD
                  x={it.x + it.w / 2}
                  y={it.y}
                  w={it.w}
                  h={it.h}
                  dpi={st.dpi}
                  zoom={zoom}
                />
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}