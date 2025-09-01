// /lib/mosaic.ts
export type MosaicItem = { id:string; w:number; h:number; };
export type MosaicFrame = { id:string; x:number; y:number; w:number; h:number };
export function balancedMosaic(
  items: MosaicItem[],
  containerW: number,
  targetRowH = 280,
  gap = 16
): MosaicFrame[] {
  const frames:MosaicFrame[] = [];
  let row:MosaicItem[] = [];
  let rowAspect = 0;
  const flush = () => {
    if (!row.length) return;
    const totalGap = gap * (row.length - 1);
    const rowW = containerW - totalGap;
    const H = Math.max(80, Math.min(targetRowH * 1.4, rowW / rowAspect));
    let x = 0;
    const y = frames.length ? Math.max(...frames.map(f=>f.y+f.h))+gap : 0;
    for (const it of row) {
      const w = (it.w / it.h) * H;
      frames.push({ id: it.id, x, y, w, h: H });
      x += w + gap;
    }
    row = []; rowAspect = 0;
  };
  for (const it of items) {
    const ar = it.w / it.h;
    if (!row.length || rowAspect + ar < containerW / targetRowH) { row.push(it); rowAspect += ar; }
    else { flush(); row.push(it); rowAspect = ar; }
  }
  flush();
  return frames;
}