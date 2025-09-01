/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Image as KImage, Line, Transformer, Text as KText, Group } from 'react-konva';
import useImage from 'use-image';
import { useAlbumStore } from '@/store/useAlbumStore';

/** ————————————————————————
 *  Helpers
 *  ———————————————————————— */
const clamp = (v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function nn(n:any, def:number){ const v=Number(n); return Number.isFinite(v)?v:def; }
function nd(n:any, min=1){ const v=Number(n); if(!Number.isFinite(v)||v<=0) return min; return v; }
function debounce<F extends (...args:any[])=>void>(fn:F, ms=250){
  let t:any; return (...args:Parameters<F>)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
}

/** aimantation + lignes (avec bleed + safe inclus plus bas) */
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

/** ————————————————————————
 *  PHOTOS
 *  ———————————————————————— */
function PhotoNode({ pageId, item, onSnapLines }:{
  pageId:string; item:any; onSnapLines:(v:{x?:number;y?:number}|null)=>void;
}){
  const asset = useAlbumStore(s=> s.assets.find(a=>a.id===item.assetId));
  const [img] = useImage(asset?.url || '');
  const trRef = useRef<any>(null);
  const nodeRef = useRef<any>(null);
  const st = useAlbumStore();
  const { updateItem, selectOnly, toggleSelect, selectedIds } = st;
  const isSelected = selectedIds.includes(item.id);

  const x = nn(item.x, 0);
  const y = nn(item.y, 0);
  const w = nd(item.width, 100);
  const h = nd(item.height, Math.round(w/(item.ar || 1.5)));

  // —— Drag + aimantation (avec bleed + safe + centre + bords existants)
  const onDragMove = (e:any) => {
    if (!st.magnet) return;
    const node = e.target;
    const curX = node.x(), curY = node.y();

    const pg = st.pages[st.currentIndex];
    const others = pg.items.filter((it:any)=> it.kind==='photo' && it.id!==item.id) as any[];
    const snapsX:number[] = [], snapsY:number[] = [];
    for (const o of others){
      const ox=nn(o.x,0), oy=nn(o.y,0), ow=nd(o.width,1), oh=nd(o.height,1);
      snapsX.push(ox, ox+ow, ox+ow/2);
      snapsY.push(oy, oy+oh, oy+oh/2);
    }

    const W = st.cmToPx(st.size.w*2), H = st.cmToPx(st.size.h);
    const bleed = st.mmToPx(st.bleedMm);
    const safe  = st.mmToPx(st.safeMm);

    // bords page + ligne de pli + bleed + safe
    snapsX.push(0, W/2, W, bleed, W-bleed, bleed+safe, W-(bleed+safe));
    snapsY.push(0, H/2, H, bleed, H-bleed, bleed+safe, H-(bleed+safe));

    const res = magnetize(curX, curY, w, h, snapsX, snapsY, st.magnetTol);
    if (res.x !== curX || res.y !== curY) node.position({ x: res.x, y: res.y });
    if (res.snapX !== undefined || res.snapY !== undefined) onSnapLines({ x: res.snapX, y: res.snapY }); else onSnapLines(null);
  };

  const onDragEnd = (e:any) => {
    // ⚠️ pas de “double snap” : on enregistre **exactement** la pos finale affichée
    const nx = e.target.x(), ny = e.target.y();
    updateItem(pageId, item.id, { x:nx, y:ny });
    onSnapLines(null);
  };

  // —— Resize (homothétie verrouillée)
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

/** ————————————————————————
 *  TEXTE
 *  ———————————————————————— */
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

/** ————————————————————————
 *  CANVAS + MODAL D’APERÇU FINAL
 *  ———————————————————————— */
export default function EditorCanvas() {
  const st = useAlbumStore();
  const { size, cmToPx, zoom, showGrid, gridSize, mmToPx, pages, currentIndex, background, showGuides } = st;
  const page = pages[currentIndex];
  const pageW = cmToPx(size.w*2);
  const pageH = cmToPx(size.h);
  const bleed = mmToPx(st.bleedMm);
  const safe  = mmToPx(st.safeMm);

  const viewportW = pageW*zoom;
  const viewportH = pageH*zoom;

  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string|null>(null);
  const [snapLines, setSnapLines] = useState<{x?:number; y?:number} | null>(null);

  // —— Modal d’aperçu
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImgs, setModalImgs] = useState<{url:string; index:number}[]>([]);
  const [modalAt, setModalAt] = useState(0);
  const goPrev = ()=> setModalAt(a=> (a>0? a-1 : modalImgs.length-1));
  const goNext = ()=> setModalAt(a=> (a<modalImgs.length-1? a+1 : 0));

  // —— centrage + fit to view
  function fitToView() {
    if (!containerRef.current) return;
    const pad = 32; // padding visuel
    const cw = containerRef.current.clientWidth - pad;
    const ch = containerRef.current.clientHeight - pad;
    const sx = cw / pageW;
    const sy = ch / pageH;
    const nz = clamp(Math.min(sx, sy), 0.1, 3);
    st.setZoom(nz);
  }

  useEffect(()=>{
    const hFit = ()=> fitToView();
    const hPrev = ()=>{
      const stage=stageRef.current; if(!stage) return;
      const dataUrl: string = stage?.toDataURL({ pixelRatio: 1 / st.zoom }) || "";
      setPreviewSrc(dataUrl);
      // ✅ push dans le store pour la colonne gauche
      st.setPagePreview(st.currentIndex, dataUrl);
    };
    window.addEventListener('raventech-fit', hFit as any);
    window.addEventListener('raventech-preview', hPrev as any);
    return ()=>{
      window.removeEventListener('raventech-fit', hFit as any);
      window.removeEventListener('raventech-preview', hPrev as any);
    };
  },[st.currentIndex, st.zoom, pageW, pageH, st]);

  // ——— Expose helpers (Toolbar export + ouverture modale)
  useEffect(()=>{
    (window as any).ravenCaptureOne = async ()=>{
      const stage = stageRef.current;
      const dataUrl: string = stage?.toDataURL({ pixelRatio: 1 / st.zoom }) || "";
      return { dataUrl, pagePx: { w: pageW, h: pageH } };
    };
    (window as any).ravenCaptureAll = async ()=>{
      const orig = st.currentIndex;
      const out: { dataUrl:string; pagePx:{w:number;h:number} }[] = [];
      for (let i=0;i<st.pages.length;i++){
        st.goTo(i);
        await new Promise(r=>setTimeout(r,50));
        const stage = stageRef.current;
        const dataUrl: string = stage?.toDataURL({ pixelRatio: 1 / st.zoom }) || "";
        out.push({ dataUrl, pagePx: { w: pageW, h: pageH } });
      }
      st.goTo(orig);
      return out;
    };
       // —— Ouverture modale courant / toutes pages
    (window as any).ravenOpenPreviewCurrent = async ()=>{
      const cap: { dataUrl: string; pagePx: { w: number; h: number } } | undefined =
        await (window as any).ravenCaptureOne?.();
      if (!cap?.dataUrl) return;
      setModalImgs([{ url: cap.dataUrl, index: st.currentIndex }]);
      setModalAt(0);
      setModalOpen(true);
    };

    (window as any).ravenOpenPreviewAll = async ()=>{
      const caps: { dataUrl: string; pagePx: { w: number; h: number } }[] | undefined =
        await (window as any).ravenCaptureAll?.();
      if (!caps?.length) return;
      setModalImgs(
        caps.map(
          (c: { dataUrl: string; pagePx: { w: number; h: number } }, idx: number) => ({
            url: c.dataUrl,
            index: idx,
          })
        )
      );
      setModalAt(st.currentIndex);
      setModalOpen(true);
    };
  }, [st.pages.length, st.currentIndex, st.zoom, pageW, pageH, st]);

  const handleBgClick = ()=> st.selectNone();

  // —— Grille
  const guides = useMemo(()=>{
    if (!showGrid) return null;
    const els:any[]=[];
    for (let x=0;x<pageW;x+=gridSize) els.push(<Line key={'gx'+x} points={[x,0,x,pageH]} stroke="#94a3b8" strokeWidth={1} listening={false} strokeScaleEnabled={false} />);
    for (let y=0;y<pageH;y+=gridSize) els.push(<Line key={'gy'+y} points={[0,y,pageW,y]} stroke="#94a3b8" strokeWidth={1} listening={false} strokeScaleEnabled={false} />);
    return els;
  },[showGrid,gridSize,pageW,pageH]);

  // —— Fond
  const bgProps:any = useMemo(()=>{
    if (background.type==='solid') return { fill: background.color1 };
    if (background.type==='linear') {
      const rad=(background.angleDeg||0)*Math.PI/180;
      const cx=pageW/2, cy=pageH/2, dx=Math.cos(rad)*pageW/2, dy=Math.sin(rad)*pageH/2;
      return { fillLinearGradientStartPoint:{x:cx-dx,y:cy-dy}, fillLinearGradientEndPoint:{x:cx+dx,y:cy+dy}, fillLinearGradientColorStops:[0,background.color1,1,(background as any).color2] };
    }
    return { fillRadialGradientStartPoint:{x:pageW/2,y:pageH/2}, fillRadialGradientEndPoint:{x:pageW/2,y:pageH/2}, fillRadialGradientStartRadius:0, fillRadialGradientEndRadius:Math.max(pageW,pageH)/1.2, fillRadialGradientColorStops:[0,(background as any).color1,1,(background as any).color2] };
  },[background,pageW,pageH]);

  // —— Centrage initial à l’ouverture
  useEffect(()=>{ fitToView(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // —— Miniature auto (debounced) à chaque modif de la page courante
  const debouncedPreview = useRef(debounce(()=>{
    const stage = stageRef.current;
    if (!stage) return;
    const dataUrl: string = stage?.toDataURL({ pixelRatio: 1 / st.zoom }) || "";
    st.setPagePreview(st.currentIndex, dataUrl);
  }, 300)).current;

  // On “observe” les changements profonds de la page courante
  useEffect(()=>{
    debouncedPreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    st.currentIndex,
    page.items.length,
    // stringify léger pour attraper position/tailles/couleurs etc.
    JSON.stringify(page.items.map((i:any)=> i.kind==='photo'
      ? [i.id,i.x,i.y,i.width,i.height,i.rotation,i.opacity]
      : [i.id,i.x,i.y,i.width,i.text,i.fontSize,i.color,i.rotation]
    )),
    background.type,
    (background as any).color1,
    (background as any).color2,
    (background as any).angleDeg,
    st.bleedMm, st.safeMm, st.showGuides, st.showGrid, st.gridSize, st.zoom
  ]);

  const selId = st.selectedIds[0] || null;
  const selItem = selId ? page.items.find((i:any)=>i.id===selId) as any : null;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-auto bg-slate-50">
      <div className="mx-auto my-6 flex items-center justify-center" style={{ width: viewportW, height: viewportH }}>
        <Stage ref={stageRef} width={viewportW} height={viewportH} scaleX={zoom} scaleY={zoom} className="rounded-xl shadow-2xl bg-white">
          <Layer>
            {/* Page */}
            <Rect x={0} y={0} width={pageW} height={pageH} cornerRadius={6} onMouseDown={handleBgClick} {...bgProps} />

            {/* Grille */}
            {guides}

            {/* Ligne de pli */}
            <Line points={[pageW/2,0,pageW/2,pageH]} stroke="#0f172a" strokeWidth={1.5} listening={false} strokeScaleEnabled={false} />

            {/* Repères bleed / safe */}
            {showGuides && (
              <>
                <Rect x={0} y={0} width={pageW} height={pageH} stroke="#ef4444" dash={[8,4]} strokeWidth={1.25} listening={false} strokeScaleEnabled={false} />
                <Rect x={bleed} y={bleed} width={pageW-2*bleed} height={pageH-2*bleed} stroke="#22c55e" dash={[8,4]} strokeWidth={1.25} listening={false} strokeScaleEnabled={false} />
                <Rect x={bleed+safe} y={bleed+safe} width={pageW-2*(bleed+safe)} height={pageH-2*(bleed+safe)} stroke="#16a34a" dash={[4,6]} strokeWidth={1} listening={false} strokeScaleEnabled={false} />
              </>
            )}

            {/* Items */}
            {page.items.map((it:any)=> it.kind==='photo'
              ? <PhotoNode key={it.id} pageId={page.id} item={it} onSnapLines={setSnapLines} />
              : <TextNode  key={it.id} pageId={page.id} item={it} />
            )}

            {/* Lignes d’aimantation visualisées */}
            {snapLines?.x !== undefined && (
              <Line points={[snapLines.x, 0, snapLines.x, pageH]} stroke="#6366f1" strokeWidth={2} dash={[6,4]} listening={false} strokeScaleEnabled={false} />
            )}
            {snapLines?.y !== undefined && (
              <Line points={[0, snapLines.y, pageW, snapLines.y]} stroke="#6366f1" strokeWidth={2} dash={[6,4]} listening={false} strokeScaleEnabled={false} />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Aperçu plein écran (clic rapide depuis évènement 'raventech-preview') */}
      {previewSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={()=>setPreviewSrc(null)}>
          <img src={previewSrc} alt="Aperçu" className="max-w-[95vw] max-h-[90vh] rounded-lg shadow-2xl" />
        </div>
      )}

      {/* MODAL : rendu final (une ou toutes les pages) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
          <div className="flex items-center justify-between p-3">
            <button
              onClick={()=>setModalOpen(false)}
              className="rounded-md bg-white/90 px-3 py-1.5 text-sm shadow hover:bg-white"
            >
              Fermer
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="rounded-md bg-white/90 px-3 py-1.5 text-sm shadow hover:bg-white"
                title="Précédent"
              >
                ←
              </button>
              <button
                onClick={goNext}
                className="rounded-md bg-white/90 px-3 py-1.5 text-sm shadow hover:bg-white"
                title="Suivant"
              >
                →
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-center justify-center">
              <img
                src={modalImgs[modalAt]?.url}
                alt={`Page ${modalImgs[modalAt]?.index+1}`}
                className="max-h-[78vh] max-w-[92vw] rounded-lg shadow-2xl bg-white"
              />
            </div>

            {/* miniatures de navigation */}
            {modalImgs.length>1 && (
              <div className="mt-4 flex items-center justify-center gap-2 overflow-x-auto px-2">
                {modalImgs.map((m,i)=>(
                  <button
                    key={i}
                    onClick={()=>setModalAt(i)}
                    className={`rounded border ${i===modalAt?'border-blue-600':'border-transparent'} bg-white/90 p-1 shadow`}
                    title={`Page ${m.index+1}`}
                  >
                    <img src={m.url} alt={`mini-${i}`} className="h-20 rounded object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug compact en bas à gauche */}
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