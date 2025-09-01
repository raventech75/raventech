/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Image as KImage, Line, Transformer, Text as KText, Group } from 'react-konva';
import useImage from 'use-image';
import { useAlbumStore } from '@/store/useAlbumStore';

/** utilitaires numériques sûrs */
function nn(n:any, def:number){ const v=Number(n); return Number.isFinite(v)?v:def; }
function nd(n:any, min=1){ const v=Number(n); if(!Number.isFinite(v)||v<=0) return min; return v; }

/** aimantation + lignes guides temporaires */
function magnetize(
  x:number,y:number,w:number,h:number,
  snapsX:number[],snapsY:number[],tol:number
){
  const L=x,R=x+w,T=y,B=y+h,CX=x+w/2,CY=y+h/2;
  let nx=x,ny=y,snapX: number|undefined,snapY: number|undefined;

  const cx=[{v:L,m:'L' as const},{v:R,m:'R' as const},{v:CX,m:'C' as const}];
  let dX=Infinity,bSX:number|undefined,bMX:'L'|'R'|'C'|undefined;
  for(const s of snapsX){
    for(const c of cx){
      const d=Math.abs(c.v-s);
      if(d<=tol && d<dX){ dX=d;bSX=s;bMX=c.m; }
    }
  }
  if(bSX!==undefined && bMX){
    if(bMX==='L') nx+=bSX-L;
    else if(bMX==='R') nx+=bSX-R;
    else nx+=bSX-CX;
    snapX=bSX;
  }

  const cy=[{v:T,m:'T' as const},{v:B,m:'B' as const},{v:CY,m:'C' as const}];
  let dY=Infinity,bSY:number|undefined,bMY:'T'|'B'|'C'|undefined;
  for(const s of snapsY){
    for(const c of cy){
      const d=Math.abs(c.v-s);
      if(d<=tol && d<dY){ dY=d;bSY=s;bMY=c.m; }
    }
  }
  if(bSY!==undefined && bMY){
    if(bMY==='T') ny+=bSY-T;
    else if(bMY==='B') ny+=bSY-B;
    else ny+=bSY-CY;
    snapY=bSY;
  }

  return { x:nx, y:ny, snapX, snapY };
}

/** --------- PHOTO NODE (homothétie + aimantation + transformer) ---------- */
function PhotoNode({
  pageId, item, onSnapLines
}:{
  pageId:string;
  item:any;
  onSnapLines:(v:{x?:number;y?:number}|null)=>void;
}){
  const asset = useAlbumStore(s=> s.assets.find(a=>a.id===item.assetId));
  const [img, status] = useImage(asset?.url || '');
  const trRef = useRef<any>(null);
  const nodeRef = useRef<any>(null);

  const st = useAlbumStore();
  const { updateItem, selectOnly, toggleSelect, selectedIds, snap, gridSize } = st;
  const isSelected = selectedIds.includes(item.id);

  const x = nn(item.x, 0);
  const y = nn(item.y, 0);
  const w = nd(item.width, 100);
  const h = nd(item.height, Math.round(w/(item.ar || 1.5)));

  useEffect(()=>{
    // debug léger
    // console.log('[RavenTech][PhotoNode] status', { id:item.id, status, x,y,w,h, ar:item.ar });
  },[status, item?.id]);

  const onDragMove = (e:any) => {
    if (!st.magnet) return;
    const node = e.target;
    const curX = node.x(), curY = node.y();

    // constitue les lignes de snap des autres items photo + marges page
    const pg = st.pages[st.currentIndex];
    const others = pg.items.filter((it:any)=> it.kind==='photo' && it.id!==item.id) as any[];

    const snapsX:number[] = [], snapsY:number[] = [];
    for (const o of others){
      const ox = nn(o.x,0), oy = nn(o.y,0), ow = nd(o.width,1), oh = nd(o.height,1);
      snapsX.push(ox, ox+ow, ox+ow/2);
      snapsY.push(oy, oy+oh, oy+oh/2);
    }

    // bords page (bleed + pli)
    const W = st.cmToPx(st.size.w*2), H = st.cmToPx(st.size.h);
    const bleed = st.mmToPx(st.bleedMm);
    snapsX.push(bleed, W/2, W-bleed);
    snapsY.push(bleed, H/2, H-bleed);

    const res = magnetize(curX, curY, w, h, snapsX, snapsY, st.magnetTol);
    if (res.x !== curX || res.y !== curY) node.position({ x: res.x, y: res.y });
    if (res.snapX !== undefined || res.snapY !== undefined) onSnapLines({ x: res.snapX, y: res.snapY });
    else onSnapLines(null);
  };

  const onDragEnd = (e:any) => {
    // on utilise la position finale *déjà aimantée*, puis on snap au grid si activé
    let nx = e.target.x(), ny = e.target.y();
    if (snap) {
      nx = Math.round(nx/gridSize)*gridSize;
      ny = Math.round(ny/gridSize)*gridSize;
      e.target.position({ x:nx, y:ny }); // évite le léger décalage visuel après drop
    }
    updateItem(pageId, item.id, { x:nx, y:ny });
    onSnapLines(null);
  };

  // 🔒 homothétie forcée (resize via transformer)
  const onTransformEnd = () => {
    const node = nodeRef.current; if (!node) return;
    // normalise les scales, puis calcule width/height homothétiques avec l'AR d’origine
    const scaledW = Math.max(20, node.width() * node.scaleX());
    const ar = item.ar || 1.5;
    const scaledH = Math.max(20, Math.round(scaledW / ar));
    node.scaleX(1); node.scaleY(1);
    updateItem(pageId, item.id, {
      width: Math.round(scaledW),
      height: scaledH,
      rotation: node.rotation()
    });
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
      {showPlaceholder && (
        <Group x={x} y={y} listening={false}>
          <Rect width={w} height={h} stroke="#0ea5e9" dash={[6,4]} strokeWidth={1.5} fill="#e0f2fe" opacity={0.6} />
          <Line points={[0,0,w,h]} stroke="#0ea5e9" strokeWidth={1} />
          <Line points={[w,0,0,h]} stroke="#0ea5e9" strokeWidth={1} />
          <KText text="chargement…" x={0} y={h/2-8} width={w} align="center" fontSize={12} fill="#0369a1" listening={false}/>
        </Group>
      )}

      <KImage
        ref={nodeRef}
        image={img || undefined}
        x={x}
        y={y}
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

/** -------------------- TEXT NODE (titres/captions) --------------------- */
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
    if (snap) {
      nx = Math.round(nx/gridSize)*gridSize;
      ny = Math.round(ny/gridSize)*gridSize;
      e.target.position({ x:nx, y:ny });
    }
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
        /* stylage */
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
          boundBoxFunc={(oldB,newB)=>({ ...newB, height: oldB.height })} // resize horizontal only
          anchorSize={8}
          borderStroke="#000"
          onTransformEnd={()=>{
            const node = nodeRef.current; if (!node) return;
            useAlbumStore.getState().updateItem(
              pageId,item.id,
              { width: Math.round(nd(node.width(), 40)), rotation: node.rotation() }
            );
          }}
        />
      )}
    </>
  );
}

/** --------------------------- EDITOR CANVAS ---------------------------- */
export default function EditorCanvas() {
  const st = useAlbumStore();

  // ✅ REF DE STAGE (fix du crash) + câblé dans <Stage ref={stageRef} />
  const stageRef = useRef<any>(null);

  const { size, cmToPx, zoom, showGrid, gridSize, mmToPx, pages, currentIndex, background, showGuides } = st;
  const page = pages[currentIndex];

  const pageW = cmToPx(size.w*2);
  const pageH = cmToPx(size.h);
  const bleed = mmToPx(st.bleedMm);
  const safe  = mmToPx(st.safeMm);

  const viewportW = pageW*zoom;
  const viewportH = pageH*zoom;

  const [previewSrc, setPreviewSrc] = useState<string|null>(null);
  const [snapLines, setSnapLines] = useState<{x?:number; y?:number} | null>(null);

  const handleBgClick = ()=> st.selectNone();

  /** Expose helpers d'export pour la Toolbar */
  useEffect(()=>{
    (window as any).ravenCaptureOne = async () => {
      // petit délai pour laisser Konva peindre
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
      const stage = stageRef.current as any;
      // neutralise le zoom d’affichage pour un rendu à la “vraie” taille px de la page
      const dataUrl: string = stage?.toDataURL({ pixelRatio: 1 / st.zoom }) || '';
      return { dataUrl, pagePx: { w: pageW, h: pageH } };
    };

    (window as any).ravenCaptureAll = async () => {
      const curr = st.currentIndex;
      const out: { dataUrl: string; pagePx: { w:number; h:number } }[] = [];
      for (let i = 0; i < st.pages.length; i++) {
        st.goTo(i);
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));
        const stage = stageRef.current as any;
        const dataUrl: string = stage?.toDataURL({ pixelRatio: 1 / st.zoom }) || '';
        out.push({ dataUrl, pagePx: { w: pageW, h: pageH } });
      }
      st.goTo(curr);
      return out;
    };

    return () => {
      delete (window as any).ravenCaptureOne;
      delete (window as any).ravenCaptureAll;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.zoom, pageW, pageH]);

  /** Aperçu modal (raccourci déjà présent ailleurs) */
  useEffect(()=>{
    const onPreview=()=>{
      const stage=stageRef.current; if(!stage) return;
      setPreviewSrc(stage.toDataURL({ pixelRatio: 2 }));
    };
    const h=()=>onPreview();
    window.addEventListener('raventech-preview',h as any);
    return ()=> window.removeEventListener('raventech-preview',h as any);
  },[]);

  /** Grille */
  const guides = useMemo(()=>{
    if (!showGrid) return null;
    const els:any[]=[];
    for (let x=0;x<pageW;x+=gridSize) {
      els.push(<Line key={'gx'+x} points={[x,0,x,pageH]} stroke="#94a3b8" strokeWidth={1} listening={false} strokeScaleEnabled={false} />);
    }
    for (let y=0;y<pageH;y+=gridSize) {
      els.push(<Line key={'gy'+y} points={[0,y,pageW,y]} stroke="#94a3b8" strokeWidth={1} listening={false} strokeScaleEnabled={false} />);
    }
    return els;
  },[showGrid,gridSize,pageW,pageH]);

  /** Fond (uni / linéaire / radial) */
  const bgProps:any = useMemo(()=>{
    if (background.type==='solid') return { fill: background.color1 };
    if (background.type==='linear') {
      const rad=(background.angleDeg||0)*Math.PI/180;
      const cx=pageW/2, cy=pageH/2, dx=Math.cos(rad)*pageW/2, dy=Math.sin(rad)*pageH/2;
      return {
        fillLinearGradientStartPoint:{x:cx-dx,y:cy-dy},
        fillLinearGradientEndPoint:{x:cx+dx,y:cy+dy},
        fillLinearGradientColorStops:[0,background.color1,1,(background as any).color2]
      };
    }
    // radial
    return {
      fillRadialGradientStartPoint:{x:pageW/2,y:pageH/2},
      fillRadialGradientEndPoint:{x:pageW/2,y:pageH/2},
      fillRadialGradientStartRadius:0,
      fillRadialGradientEndRadius:Math.max(pageW,pageH)/1.2,
      fillRadialGradientColorStops:[0,(background as any).color1,1,(background as any).color2]
    };
  },[background,pageW,pageH]);

  const selId = st.selectedIds[0] || null;
  const selItem = selId ? page.items.find((i:any)=>i.id===selId) as any : null;

  return (
    <div className="relative w-full h-full overflow-auto bg-white">
      <div className="mx-auto my-6" style={{ width: viewportW, height: viewportH }}>
        <Stage
          ref={stageRef}
          width={viewportW}
          height={viewportH}
          scaleX={zoom}
          scaleY={zoom}
          className="rounded-xl shadow-2xl bg-white"
          onMouseDown={(e)=>{ if (e.target === e.target.getStage()) handleBgClick(); }}
        >
          <Layer>
            {/* Fond */}
            <Rect
              x={0}
              y={0}
              width={pageW}
              height={pageH}
              cornerRadius={6}
              onMouseDown={handleBgClick}
              {...bgProps}
            />

            {/* Grille */}
            {guides}

            {/* Pli */}
            <Line
              points={[pageW/2,0,pageW/2,pageH]}
              stroke="#0f172a"
              strokeWidth={1.5}
              listening={false}
              strokeScaleEnabled={false}
            />

            {/* Repères bleed/safe */}
            {showGuides && (
              <>
                <Rect
                  x={0} y={0}
                  width={pageW} height={pageH}
                  stroke="#ef4444" dash={[8,4]} strokeWidth={1.25}
                  listening={false} strokeScaleEnabled={false}
                />
                <Rect
                  x={bleed} y={bleed}
                  width={pageW-2*bleed} height={pageH-2*bleed}
                  stroke="#22c55e" dash={[8,4]} strokeWidth={1.25}
                  listening={false} strokeScaleEnabled={false}
                />
                <Rect
                  x={bleed+safe} y={bleed+safe}
                  width={pageW-2*(bleed+safe)} height={pageH-2*(bleed+safe)}
                  stroke="#16a34a" dash={[4,6]} strokeWidth={1}
                  listening={false} strokeScaleEnabled={false}
                />
              </>
            )}

            {/* Items */}
            {page.items.map((it:any)=>
              it.kind==='photo'
                ? <PhotoNode key={it.id} pageId={page.id} item={it} onSnapLines={setSnapLines} />
                : <TextNode  key={it.id} pageId={page.id} item={it} />
            )}

            {/* Lignes de snap temporaires */}
            {snapLines?.x !== undefined && (
              <Line points={[snapLines.x, 0, snapLines.x, pageH]} stroke="#6366f1" strokeWidth={2} dash={[6,4]} listening={false} strokeScaleEnabled={false} />
            )}
            {snapLines?.y !== undefined && (
              <Line points={[0, snapLines.y, pageW, snapLines.y]} stroke="#6366f1" strokeWidth={2} dash={[6,4]} listening={false} strokeScaleEnabled={false} />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Aperçu plein écran */}
      {previewSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={()=>setPreviewSrc(null)}>
          <img src={previewSrc} alt="Aperçu" className="max-w-[95vw] max-h-[90vh] rounded-lg shadow-2xl" />
        </div>
      )}

      {/* Debug HUD (optionnel) */}
      <div className="fixed left-3 bottom-3 z-50 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow">
        <div>Assets: {st.assets.length} — Items page: {page.items.length}</div>
        {selItem && (
          <div>
            Sélection: {selItem.kind} — ar: {Math.round((selItem.ar||1.5)*100)/100} — w:{Math.round(selItem.width)} h:{Math.round(selItem.height)}
          </div>
        )}
      </div>
    </div>
  );
}