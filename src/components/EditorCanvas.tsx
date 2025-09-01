/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Stage, Layer, Rect, Image as KImage, Line, Transformer, Text as KText, Group } from 'react-konva';
import useImage from 'use-image';
import { useAlbumStore } from '@/store/useAlbumStore';

function nn(n:any, def:number){ const v=Number(n); return Number.isFinite(v)?v:def; }
function nd(n:any, min=1){ const v=Number(n); if(!Number.isFinite(v)||v<=0) return min; return v; }

function magnetize(x:number,y:number,w:number,h:number,snapsX:number[],snapsY:number[],tol:number){
  const L=x,R=x+w,T=y,B=y+h,CX=x+w/2,CY=y+h/2;
  let nx=x,ny=y,snapX: number|undefined,snapY: number|undefined;
  const cx=[{v:L,m:'L' as const},{v:R,m:'R' as const},{v:CX,m:'C' as const}];
  let dX=Infinity,bSX:number|undefined,bMX:'L'|'R'|'C'|undefined;
  for(const s of snapsX) for(const c of cx){ const d=Math.abs(c.v-s); if(d<=tol && d<dX){dX=d;bSX=s;bMX=c.m;}}
  if(bSX!==undefined && bMX){ if(bMX==='L') nx+=bSX-L; else if(bMX==='R') nx+=bSX-R; else nx+=bSX-CX; snapX=bSX; }
  const cy=[{v:T,m:'T' as const},{v:B,m:'B' as const},{v:CY,m:'C' as const}];
  let dY=Infinity,bSY:number|undefined,bMY:'T'|'B'|'C'|undefined;
  for(const s of snapsY) for(const c of cy){ const d=Math.abs(c.v-s); if(d<=tol && d<dY){dY=d;bSY=s;bMY=c.m;}}
  if(bSY!==undefined && bMY){ if(bMY==='T') ny+=bSY-T; else if(bMY==='B') ny+=bSY-B; else ny+=bSY-CY; snapY=bSY; }
  return { x:nx, y:ny, snapX, snapY };
}

function RoundedClip({ w, h, r }: { w:number; h:number; r:number }) {
  return (
    <Group
      clipFunc={(ctx) => {
        const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
        const x = 0, y = 0;
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        ctx.lineTo(x + rr, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
        ctx.lineTo(x, y + rr);
        ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.closePath();
      }}
    />
  );
}

function PhotoNode({ pageId, item, onSnapLines }:{
  pageId:string; item:any; onSnapLines:(v:{x?:number;y?:number}|null)=>void;
}){
  const asset = useAlbumStore(s=> s.assets.find(a=>a.id===item.assetId));
  const [img] = useImage(asset?.url || '');
  const trRef = useRef<any>(null);
  const nodeRef = useRef<any>(null);
  const hadSnapRef = useRef(false);

  const st = useAlbumStore();
  const { updateItem, selectOnly, toggleSelect, selectedIds, snap, gridSize } = st;
  const isSelected = selectedIds.includes(item.id);

  const x = nn(item.x, 0);
  const y = nn(item.y, 0);
  const w = nd(item.width, 100);
  const h = nd(item.height, Math.round(w/(item.ar || 1.5)));

  const fadeTop    = Math.max(0, Number(item.fadeTop    ?? 0));
  const fadeBottom = Math.max(0, Number(item.fadeBottom ?? 0));
  const fadeLeft   = Math.max(0, Number(item.fadeLeft   ?? 0));
  const fadeRight  = Math.max(0, Number(item.fadeRight  ?? 0));

  const onDragMove = (e:any) => {
    if (!st.magnet) return;
    const node = e.target;
    const curX = node.x(), curY = node.y();

    const pg = st.pages[st.currentIndex];
    const others = pg.items.filter((it:any)=> it.kind==='photo' && it.id!==item.id) as any[];
    const snapsX:number[] = [], snapsY:number[] = [];
    for (const o of others){ snapsX.push(nn(o.x,0), nn(o.x,0)+nd(o.width,1), nn(o.x,0)+nd(o.width,1)/2); snapsY.push(nn(o.y,0), nn(o.y,0)+nd(o.height,1), nn(o.y,0)+nd(o.height,1)/2); }

    const W = st.cmToPx(st.size.w*2), H = st.cmToPx(st.size.h);
    const bleed = st.mmToPx(st.bleedMm);
    snapsX.push(bleed, W/2, W-bleed);
    snapsY.push(bleed, H/2, H-bleed);

    const res = magnetize(curX, curY, w, h, snapsX, snapsY, st.magnetTol);
    hadSnapRef.current = !!(res.snapX || res.snapY);
    if (res.x !== curX || res.y !== curY) node.position({ x: res.x, y: res.y });
    if (res.snapX !== undefined || res.snapY !== undefined) onSnapLines({ x: res.snapX, y: res.snapY }); else onSnapLines(null);
  };

  const onDragEnd = (e:any) => {
    let nx = e.target.x(), ny = e.target.y();
    if (!hadSnapRef.current && snap) {
      nx = Math.round(nx/gridSize)*gridSize; 
      ny = Math.round(ny/gridSize)*gridSize;
    }
    hadSnapRef.current = false;
    updateItem(pageId, item.id, { x:nx, y:ny });
    onSnapLines(null);
  };

  const onTransformEnd = () => {
    const node = nodeRef.current; if (!node) return;
    const newW = Math.max(20, node.width() * node.scaleX());
    const ar = item.ar || 1.5;
    const newH = Math.max(20, Math.round(newW / ar));
    node.scaleX(1); node.scaleY(1);
    updateItem(pageId, item.id, { width: Math.round(newW), height: newH, rotation: node.rotation() });
  };

  useEffect(()=>{
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  },[isSelected]);

  const showPlaceholder = !img;

  return (
    <>
      {/* On groupe tout à (x,y) pour que les masques s’alignent parfaitement */}
      <Group x={x} y={y}>

        {/* Clip coins arrondis */}
        <RoundedClip w={w} h={h} r={nn(item.cornerR, 0)} />

        {/* Image */}
        <KImage
          ref={nodeRef}
          image={img || undefined}
          x={0}
          y={0}
          width={w}
          height={h}
          rotation={nn(item.rotation,0)}
          opacity={nn(item.opacity,1)}
          draggable
          onClick={(e)=>{ if (e.evt.shiftKey) toggleSelect(item.id); else selectOnly(item.id); }}
          onTap={()=> selectOnly(item.id)}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
          onLoad={()=> nodeRef.current?.getLayer()?.batchDraw()}
        />

        {/* ⬇️ Masques de fondu (destination-in) */}
        {/* TOP */}
        {fadeTop>0 && (
          <Rect
            x={0} y={0} width={w} height={h}
            globalCompositeOperation="destination-in"
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: h }}
            fillLinearGradientColorStops={[
              0, `rgba(255,255,255,0)`,
              Math.min(1, fadeTop / h), `rgba(255,255,255,1)`,
              1, `rgba(255,255,255,1)`
            ]}
            listening={false}
          />
        )}
        {/* BOTTOM */}
        {fadeBottom>0 && (
          <Rect
            x={0} y={0} width={w} height={h}
            globalCompositeOperation="destination-in"
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: h }}
            fillLinearGradientColorStops={[
              0, `rgba(255,255,255,1)`,
              Math.max(0, 1 - fadeBottom / h), `rgba(255,255,255,1)`,
              1, `rgba(255,255,255,0)`
            ]}
            listening={false}
          />
        )}
        {/* LEFT */}
        {fadeLeft>0 && (
          <Rect
            x={0} y={0} width={w} height={h}
            globalCompositeOperation="destination-in"
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: w, y: 0 }}
            fillLinearGradientColorStops={[
              0, `rgba(255,255,255,0)`,
              Math.min(1, fadeLeft / w), `rgba(255,255,255,1)`,
              1, `rgba(255,255,255,1)`
            ]}
            listening={false}
          />
        )}
        {/* RIGHT */}
        {fadeRight>0 && (
          <Rect
            x={0} y={0} width={w} height={h}
            globalCompositeOperation="destination-in"
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: w, y: 0 }}
            fillLinearGradientColorStops={[
              0, `rgba(255,255,255,1)`,
              Math.max(0, 1 - fadeRight / w), `rgba(255,255,255,1)`,
              1, `rgba(255,255,255,0)`
            ]}
            listening={false}
          />
        )}

        {/* Bordure par-dessus */}
        {nn(item.borderW,0)>0 && (
          <Rect
            x={0} y={0} width={w} height={h}
            stroke={item.borderColor || '#111827'}
            strokeWidth={nn(item.borderW, 0)}
            listening={false}
          />
        )}

        {/* Placeholder si image pas prête */}
        {showPlaceholder && (
          <Group listening={false}>
            <Rect width={w} height={h} stroke="#0ea5e9" dash={[6,4]} strokeWidth={1.5} fill="#e0f2fe" opacity={0.6} />
          </Group>
        )}
      </Group>

      {/* Handles Transformer (sur l’image) */}
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

function TextNode({ pageId, item }: { pageId: string; item: any }) {
  const trRef = useRef<any>(null);
  const nodeRef = useRef<any>(null);
  const { updateItem, selectOnly, toggleSelect, selectedIds, snap, gridSize } = useAlbumStore();
  const isSelected = selectedIds.includes(item.id);

  const x = nn(item.x, 0);
  const y = nn(item.y, 0);
  const w = nd(item.width, 200);

  const onDragEnd = (e:any) => {
    let nx = e.target.x(), ny = e.target.y();
    if (snap) { nx = Math.round(nx/gridSize)*gridSize; ny = Math.round(ny/gridSize)*gridSize; }
    updateItem(pageId, item.id, { x:nx, y:ny });
  };

  useEffect(()=>{
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  },[isSelected]);

  return (
    <>
      <KText
        ref={nodeRef}
        x={x}
        y={y}
        width={w}
        text={item.text ?? ''}
        fontSize={nn(item.fontSize, 32)}
        fontFamily={item.fontFamily ?? 'Inter, system-ui, sans-serif'}
        align={item.align ?? 'left'}
        fill={item.color ?? '#000'}
        rotation={nn(item.rotation,0)}
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
            useAlbumStore.getState().updateItem(pageId,item.id,{ width: Math.round(nd(node.width(), 40)), rotation: node.rotation() });
          }}
        />
      )}
    </>
  );
}

export default function EditorCanvas() {
  const st = useAlbumStore();
  const { size, cmToPx, zoom, showGrid, gridSize, mmToPx, pages, currentIndex, background, showGuides } = st;
  const page = pages[currentIndex];
  const pageW = cmToPx(size.w*2);
  const pageH = cmToPx(size.h);
  const bleed = mmToPx(st.bleedMm);
  const safe  = mmToPx(st.safeMm);

  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [snapLines, setSnapLines] = useState<{x?:number; y?:number} | null>(null);

  // ✅ Zoom auto pour que la page rentre entière et reste centrée
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw <= 0 || ch <= 0) return;
      const z = Math.max(0.1, Math.min(cw / pageW, ch / pageH) * 0.98);
      st.setZoom(parseFloat(z.toFixed(3)));
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageW, pageH]);

  const guides = useMemo(()=>{
    if (!showGrid) return null;
    const els:any[]=[];
    for (let x=0;x<pageW;x+=gridSize) els.push(<Line key={'gx'+x} points={[x,0,x,pageH]} stroke="#cbd5e1" strokeWidth={1} listening={false} strokeScaleEnabled={false} />);
    for (let y=0;y<pageH;y+=gridSize) els.push(<Line key={'gy'+y} points={[0,y,pageW,y]} stroke="#cbd5e1" strokeWidth={1} listening={false} strokeScaleEnabled={false} />);
    return els;
  },[showGrid,gridSize,pageW,pageH]);

  const bgProps:any = useMemo(()=>{
    if (background.type==='solid') return { fill: background.color1 };
    if (background.type==='linear') {
      const rad=(background.angleDeg||0)*Math.PI/180;
      const cx=pageW/2, cy=pageH/2, dx=Math.cos(rad)*pageW/2, dy=Math.sin(rad)*pageH/2;
      return { fillLinearGradientStartPoint:{x:cx-dx,y:cy-dy}, fillLinearGradientEndPoint:{x:cx+dx,y:cy+dy}, fillLinearGradientColorStops:[0,background.color1,1,(background as any).color2] };
    }
    return { fillRadialGradientStartPoint:{x:pageW/2,y:pageH/2}, fillRadialGradientEndPoint:{x:pageW/2,y:pageH/2}, fillRadialGradientStartRadius:0, fillRadialGradientEndRadius:Math.max(pageW,pageH)/1.2, fillRadialGradientColorStops:[0,(background as any).color1,1,(background as any).color2] };
  },[background,pageW,pageH]);

  const selId = st.selectedIds[0] || null;
  const selItem = selId ? page.items.find((i:any)=>i.id===selId) as any : null;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-100">
      {/* conteneur centre avec flex */}
      <div className="flex h-full w-full items-center justify-center">
        <Stage
          ref={stageRef}
          width={pageW * zoom}
          height={pageH * zoom}
          scaleX={zoom}
          scaleY={zoom}
          className="rounded-xl shadow-2xl bg-white"
        >
          <Layer>
            <Rect x={0} y={0} width={pageW} height={pageH} cornerRadius={6} {...bgProps} onMouseDown={()=>st.selectNone()} />

            {guides}

            {/* pli */}
            <Line points={[pageW/2,0,pageW/2,pageH]} stroke="#0f172a" strokeWidth={1.25} listening={false} strokeScaleEnabled={false} />

            {/* guides bleed/safe */}
            {showGuides && (
              <>
                <Rect x={0} y={0} width={pageW} height={pageH} stroke="#ef4444" dash={[8,4]} strokeWidth={1.1} listening={false} strokeScaleEnabled={false} />
                <Rect x={bleed} y={bleed} width={pageW-2*bleed} height={pageH-2*bleed} stroke="#22c55e" dash={[8,4]} strokeWidth={1.1} listening={false} strokeScaleEnabled={false} />
                <Rect x={bleed+safe} y={bleed+safe} width={pageW-2*(bleed+safe)} height={pageH-2*(bleed+safe)} stroke="#16a34a" dash={[4,6]} strokeWidth={1} listening={false} strokeScaleEnabled={false} />
              </>
            )}

            {/* items (ordre = z-index) */}
            {page.items.map((it:any)=> it.kind==='photo'
              ? <PhotoNode key={it.id} pageId={page.id} item={it} onSnapLines={setSnapLines} />
              : <TextNode  key={it.id} pageId={page.id} item={it} />
            )}

            {snapLines?.x !== undefined && (
              <Line points={[snapLines.x, 0, snapLines.x, pageH]} stroke="#6366f1" strokeWidth={2} dash={[6,4]} listening={false} strokeScaleEnabled={false} />
            )}
            {snapLines?.y !== undefined && (
              <Line points={[0, snapLines.y, pageW, snapLines.y]} stroke="#6366f1" strokeWidth={2} dash={[6,4]} listening={false} strokeScaleEnabled={false} />
            )}
          </Layer>
        </Stage>
      </div>

      {/* HUD debug (facultatif) */}
      {selItem && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-30 -translate-x-1/2 rounded bg-white/90 px-2 py-1 text-[11px] text-slate-700 shadow">
          ar {Math.round((selItem.ar||1.5)*100)/100} — w:{Math.round(selItem.width)} h:{Math.round(selItem.height)}
        </div>
      )}
    </div>
  );
}