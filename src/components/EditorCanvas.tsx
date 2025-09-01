/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KImage, Line, Transformer, Text as KText, Group } from 'react-konva';
import useImage from 'use-image';
import { useAlbumStore } from '@/store/useAlbumStore';

/** ---------- helpers ---------- */
function nnum(n: unknown, d: number) { const v = Number(n); return Number.isFinite(v) ? v : d; }
function ndim(n: unknown, min = 1) { const v = Number(n); return Number.isFinite(v) && v > 0 ? v : min; }

/** aimantation (aux bords/centres des autres items + bords utiles) */
function magnetize(x:number,y:number,w:number,h:number,snapsX:number[],snapsY:number[],tol:number){
  const L=x,R=x+w,T=y,B=y+h,CX=x+w/2,CY=y+h/2;
  let nx=x,ny=y,snapX: number|undefined,snapY: number|undefined;

  const candX = [{v:L, m:'L' as const}, {v:R, m:'R' as const}, {v:CX, m:'C' as const}];
  let dX=Infinity, bestSX: number|undefined, bestMX: 'L'|'R'|'C'|undefined;
  for (const s of snapsX) {
    for (const c of candX) {
      const d = Math.abs(c.v - s);
      if (d <= tol && d < dX) { dX = d; bestSX = s; bestMX = c.m; }
    }
  }
  if (bestSX !== undefined && bestMX) {
    if (bestMX === 'L') nx += bestSX - L;
    else if (bestMX === 'R') nx += bestSX - R;
    else nx += bestSX - CX;
    snapX = bestSX;
  }

  const candY = [{v:T, m:'T' as const}, {v:B, m:'B' as const}, {v:CY, m:'C' as const}];
  let dY=Infinity, bestSY: number|undefined, bestMY: 'T'|'B'|'C'|undefined;
  for (const s of snapsY) {
    for (const c of candY) {
      const d = Math.abs(c.v - s);
      if (d <= tol && d < dY) { dY = d; bestSY = s; bestMY = c.m; }
    }
  }
  if (bestSY !== undefined && bestMY) {
    if (bestMY === 'T') ny += bestSY - T;
    else if (bestMY === 'B') ny += bestSY - B;
    else ny += bestSY - CY;
    snapY = bestSY;
  }
  return { x: nx, y: ny, snapX, snapY };
}

/** ---------- PhotoNode (homothétie verrouillée, aimantation sans décalage) ---------- */
function PhotoNode({
  pageId,
  item,
  onSnapLines
}:{
  pageId: string;
  item: any;
  onSnapLines: (v: {x?: number; y?: number} | null) => void;
}) {
  const asset = useAlbumStore(s => s.assets.find(a => a.id === item.assetId));
  const [img] = useImage(asset?.url || '');
  const trRef = useRef<any>(null);
  const nodeRef = useRef<any>(null);

  const st = useAlbumStore();
  const { updateItem, selectOnly, toggleSelect, selectedIds, snap, gridSize } = st;
  const isSelected = selectedIds.includes(item.id);

  const x = nnum(item.x, 0);
  const y = nnum(item.y, 0);
  const w = ndim(item.width, 100);
  const h = ndim(item.height, Math.round(w / (item.ar || 1.5)));

  const buildSnapArrays = useCallback(() => {
    const pg = st.pages[st.currentIndex];
    const others = pg.items.filter((it: any) => it.kind === 'photo' && it.id !== item.id) as any[];
    const snapsX:number[] = [], snapsY:number[] = [];
    for (const o of others) {
      const ox = nnum(o.x, 0), oy = nnum(o.y, 0);
      const ow = ndim(o.width, 1), oh = ndim(o.height, 1);
      snapsX.push(ox, ox + ow, ox + ow / 2);
      snapsY.push(oy, oy + oh, oy + oh / 2);
    }
    const W = st.cmToPx(st.size.w * 2), H = st.cmToPx(st.size.h);
    const bleed = st.mmToPx(st.bleedMm);
    snapsX.push(bleed, W / 2, W - bleed);
    snapsY.push(bleed, H / 2, H - bleed);
    return { snapsX, snapsY };
  }, [st.pages, st.currentIndex, st.size, st.bleedMm]);

  const onDragMove = (e: any) => {
    if (!st.magnet) return;
    const node = e.target;
    const curX = node.x(), curY = node.y();
    const { snapsX, snapsY } = buildSnapArrays();
    const res = magnetize(curX, curY, w, h, snapsX, snapsY, st.magnetTol);
    if (res.x !== curX || res.y !== curY) node.position({ x: res.x, y: res.y });
    if (res.snapX !== undefined || res.snapY !== undefined) onSnapLines({ x: res.snapX, y: res.snapY });
    else onSnapLines(null);
  };

  const onDragEnd = (e: any) => {
    let nx = e.target.x(), ny = e.target.y();

    // si aimantation active, on refait EXACTEMENT le même calcul -> pas de “décalage”
    if (st.magnet) {
      const { snapsX, snapsY } = buildSnapArrays();
      const res = magnetize(nx, ny, w, h, snapsX, snapsY, st.magnetTol);
      nx = res.x; ny = res.y;
    }

    if (snap) {
      nx = Math.round(nx / gridSize) * gridSize;
      ny = Math.round(ny / gridSize) * gridSize;
    }
    updateItem(pageId, item.id, { x: nx, y: ny });
    onSnapLines(null);
  };

  const onTransformEnd = () => {
    const node = nodeRef.current; if (!node) return;
    const currentW = node.width() * node.scaleX(); // taille affichée
    const ar = item.ar || 1.5;
    const newW = Math.max(20, currentW);
    const newH = Math.round(newW / ar);
    node.scaleX(1); node.scaleY(1); // normalise
    updateItem(pageId, item.id, { width: Math.round(newW), height: newH, rotation: node.rotation() });
  };

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KImage
        ref={nodeRef}
        image={img || undefined}
        x={x} y={y}
        width={w} height={h}
        rotation={nnum(item.rotation, 0)}
        opacity={nnum(item.opacity, 1)}
        draggable
        onClick={(e)=>{ if (e.evt.shiftKey) toggleSelect(item.id); else selectOnly(item.id); }}
        onTap={()=> selectOnly(item.id)}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
        listening
      />
      {isSelected && nodeRef.current && (
        <Transformer
          ref={trRef}
          rotateEnabled
          keepRatio
          enabledAnchors={['top-left','top-right','bottom-left','bottom-right']}
          anchorSize={8}
          borderStroke="#000"
        />
      )}
    </>
  );
}

/** ---------- TextNode ---------- */
function TextNode({ pageId, item }: { pageId: string; item: any }) {
  const trRef = useRef<any>(null);
  const nodeRef = useRef<any>(null);
  const { updateItem, selectOnly, toggleSelect, selectedIds, snap, gridSize } = useAlbumStore();
  const isSelected = selectedIds.includes(item.id);

  const x = nnum(item.x, 0);
  const y = nnum(item.y, 0);
  const w = ndim(item.width, 200);

  const onDragEnd = (e: any) => {
    let nx = e.target.x(), ny = e.target.y();
    if (snap) { nx = Math.round(nx / gridSize) * gridSize; ny = Math.round(ny / gridSize) * gridSize; }
    updateItem(pageId, item.id, { x: nx, y: ny });
  };

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KText
        ref={nodeRef}
        x={x}
        y={y}
        width={w}
        text={item.text ?? ''}
        fontSize={nnum(item.fontSize, 32)}
        fontFamily={item.fontFamily ?? 'Inter, system-ui, sans-serif'}
        align={item.align ?? 'left'}
        fill={item.color ?? '#000'}
        rotation={nnum(item.rotation, 0)}
        fontStyle={(item.fontWeight ?? 400) >= 600 ? 'bold' : 'normal'}
        letterSpacing={item.letterSpacing ?? 0}
        lineHeight={item.lineHeight ?? 1.2}
        draggable
        onClick={(e)=>{ if (e.evt.shiftKey) toggleSelect(item.id); else selectOnly(item.id); }}
        onDblClick={()=> {
          const t = prompt('Texte :', item.text ?? '');
          if (t !== null) updateItem(pageId, item.id, { text: t });
        }}
        onDragEnd={onDragEnd}
      />
      {isSelected && nodeRef.current && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={['middle-left','middle-right']}
          boundBoxFunc={(oldB,newB)=>({ ...newB, height: oldB.height })}
          anchorSize={8}
          borderStroke="#000"
          onTransformEnd={()=>{
            const node = nodeRef.current; if (!node) return;
            useAlbumStore.getState().updateItem(pageId, item.id, { width: Math.round(ndim(node.width(), 40)), rotation: node.rotation() });
          }}
        />
      )}
    </>
  );
}

/** ---------- EditorCanvas ---------- */
export default function EditorCanvas() {
  const st = useAlbumStore();
  const { size, cmToPx, zoom, showGrid, gridSize, mmToPx, pages, currentIndex, background, showGuides } = st;
  const page = pages[currentIndex];

  const pageW = cmToPx(size.w * 2);
  const pageH = cmToPx(size.h);
  const bleed = mmToPx(st.bleedMm);
  const safe  = mmToPx(st.safeMm);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<any>(null);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number } | null>(null);

  /** --- centrage + fit to screen au montage + on resize --- */
  const fitToView = useCallback(() => {
    const box = viewportRef.current;
    if (!box) return;
    const padding = 48; // marges
    const availW = Math.max(200, box.clientWidth - padding);
    const availH = Math.max(200, box.clientHeight - padding);
    const scale = Math.max(0.1, Math.min(availW / pageW, availH / pageH));
    // arrondi doux
    const rounded = Math.round(scale * 100) / 100;
    st.setZoom(rounded);
  }, [pageW, pageH, st]);

  useEffect(() => {
    fitToView();
    const onR = () => fitToView();
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageW, pageH]);

  /** --- preview modal trigger --- */
  useEffect(() => {
    const handler = () => {
      const stage = stageRef.current as any;
      const dataUrl: string = stage?.toDataURL({ pixelRatio: 1 / st.zoom }) || "";
      setPreviewSrc(dataUrl);
    };
    window.addEventListener('raventech-preview', handler as any);
    return () => window.removeEventListener('raventech-preview', handler as any);
  }, [st.zoom]);

  /** --- guides & fond --- */
  const guides = useMemo(() => {
    if (!showGrid) return null;
    const els: React.ReactNode[] = [];
    for (let x = 0; x < pageW; x += gridSize) els.push(<Line key={'gx' + x} points={[x, 0, x, pageH]} stroke="#cbd5e1" strokeWidth={1} listening={false} strokeScaleEnabled={false} />);
    for (let y = 0; y < pageH; y += gridSize) els.push(<Line key={'gy' + y} points={[0, y, pageW, y]} stroke="#cbd5e1" strokeWidth={1} listening={false} strokeScaleEnabled={false} />);
    return els;
  }, [showGrid, gridSize, pageW, pageH]);

  const bgProps: any = useMemo(() => {
    if (background.type === 'solid') return { fill: background.color1 };
    if (background.type === 'linear') {
      const rad = (background.angleDeg || 0) * Math.PI / 180;
      const cx = pageW / 2, cy = pageH / 2, dx = Math.cos(rad) * pageW / 2, dy = Math.sin(rad) * pageH / 2;
      return {
        fillLinearGradientStartPoint: { x: cx - dx, y: cy - dy },
        fillLinearGradientEndPoint: { x: cx + dx, y: cy + dy },
        fillLinearGradientColorStops: [0, background.color1, 1, (background as any).color2]
      };
    }
    return {
      fillRadialGradientStartPoint: { x: pageW / 2, y: pageH / 2 },
      fillRadialGradientEndPoint: { x: pageW / 2, y: pageH / 2 },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius: Math.max(pageW, pageH) / 1.2,
      fillRadialGradientColorStops: [0, (background as any).color1, 1, (background as any).color2]
    };
  }, [background, pageW, pageH]);

  const selId = st.selectedIds[0] || null;
  const selItem = selId ? (page.items.find((i: any) => i.id === selId) as any) : null;

  return (
    <div ref={viewportRef} className="relative h-full w-full overflow-auto bg-slate-100">
      {/* conteneur centré */}
      <div className="mx-auto my-6 flex items-center justify-center">
        <Stage
          ref={stageRef}
          width={pageW * zoom}
          height={pageH * zoom}
          scaleX={zoom}
          scaleY={zoom}
          className="rounded-xl shadow-2xl bg-white"
        >
          <Layer>
            {/* fond & clic déselection */}
            <Rect x={0} y={0} width={pageW} height={pageH} cornerRadius={8} {...bgProps} onMouseDown={() => st.selectNone()} />

            {/* grille */}
            {guides}

            {/* pli */}
            <Line points={[pageW/2, 0, pageW/2, pageH]} stroke="#0f172a" strokeWidth={1.25} listening={false} strokeScaleEnabled={false} />

            {/* traits bleed/safe */}
            {showGuides && (
              <>
                <Rect x={0} y={0} width={pageW} height={pageH} stroke="#ef4444" dash={[8, 4]} strokeWidth={1.25} listening={false} strokeScaleEnabled={false} />
                <Rect x={bleed} y={bleed} width={pageW - 2 * bleed} height={pageH - 2 * bleed} stroke="#22c55e" dash={[8, 4]} strokeWidth={1.25} listening={false} strokeScaleEnabled={false} />
                <Rect x={bleed + safe} y={bleed + safe} width={pageW - 2 * (bleed + safe)} height={pageH - 2 * (bleed + safe)} stroke="#16a34a" dash={[4, 6]} strokeWidth={1} listening={false} strokeScaleEnabled={false} />
              </>
            )}

            {/* items */}
            {page.items.map((it: any) =>
              it.kind === 'photo'
                ? <PhotoNode key={it.id} pageId={page.id} item={it} onSnapLines={setSnapLines} />
                : <TextNode  key={it.id} pageId={page.id} item={it} />
            )}

            {/* lignes d’aimantation */}
            {snapLines?.x !== undefined && (
              <Line points={[snapLines.x, 0, snapLines.x, pageH]} stroke="#6366f1" strokeWidth={2} dash={[6, 4]} listening={false} strokeScaleEnabled={false} />
            )}
            {snapLines?.y !== undefined && (
              <Line points={[0, snapLines.y, pageW, snapLines.y]} stroke="#6366f1" strokeWidth={2} dash={[6, 4]} listening={false} strokeScaleEnabled={false} />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Aperçu plein écran */}
      {previewSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewSrc(null)}>
          <img src={previewSrc} alt="Aperçu" className="max-w-[95vw] max-h-[90vh] rounded-lg shadow-2xl" />
        </div>
      )}

      {/* HUD debug léger */}
      <div className="fixed left-3 bottom-3 z-50 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow">
        <div>Assets: {st.assets.length} — Page items: {page.items.length}</div>
        <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
        {selItem && (
          <div>
            Sélection: {selItem.kind} — w:{Math.round(selItem.width)} h:{Math.round(selItem.height)}
          </div>
        )}
      </div>
    </div>
  );
}