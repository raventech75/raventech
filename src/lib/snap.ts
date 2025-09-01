// /lib/snap.ts
export type Rect = { x: number; y: number; w: number; h: number };
export type SnapGuide = { type: "v" | "h"; at: number };
export function getSnap(
  moving: Rect,
  others: Rect[],
  tol = 10,
  grid: number | null = null
) {
  const m = {
    l: moving.x, r: moving.x + moving.w, t: moving.y, b: moving.y + moving.h,
    cx: moving.x + moving.w / 2, cy: moving.y + moving.h / 2
  };
  let dx = 0, dy = 0;
  const guides: SnapGuide[] = [];
  const within = (a:number,b:number)=>Math.abs(a-b)<=tol;
  for (const o of others) {
    const c = { l:o.x, r:o.x+o.w, t:o.y, b:o.y+o.h, cx:o.x+o.w/2, cy:o.y+o.h/2 };
    if (within(m.l+dx, c.l)) { dx = c.l - m.l; guides.push({type:"v",at:c.l}); }
    if (within(m.r+dx, c.r)) { dx = c.r - m.r; guides.push({type:"v",at:c.r}); }
    if (within(m.cx+dx,c.cx)){ dx = c.cx- m.cx; guides.push({type:"v",at:c.cx});}
    if (within(m.t+dy, c.t)) { dy = c.t - m.t; guides.push({type:"h",at:c.t}); }
    if (within(m.b+dy, c.b)) { dy = c.b - m.b; guides.push({type:"h",at:c.b}); }
    if (within(m.cy+dy,c.cy)){ dy = c.cy- m.cy; guides.push({type:"h",at:c.cy});}
  }
  let nx = moving.x + dx, ny = moving.y + dy;
  if (grid && grid > 0) {
    nx = Math.round(nx / grid) * grid;
    ny = Math.round(ny / grid) * grid;
  }
  return { x: nx, y: ny, guides };
}