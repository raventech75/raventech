// /lib/pdf.ts
import { PDFDocument, rgb } from "pdf-lib";
const mmToPt = (mm:number)=>(mm*72)/25.4;
export async function exportWithCrop({
  pages, // [{images:[{url,x,y,w,h}], texts:[{text,x,y,size,color,align}], pagePx:{w,h}}]
  bleedMM = 3, dpi = 150
}:{
  pages: { images:{url:string;x:number;y:number;w:number;h:number}[]; texts?:{text:string;x:number;y:number;size:number;color?:string;align?:"left"|"center"|"right"}[]; pagePx:{w:number;h:number} }[];
  bleedMM?: number; dpi?: number;
}) {
  const pdf = await PDFDocument.create();
  const pxToPt = (px:number)=>(px/dpi)*72;
  const bleed = mmToPt(bleedMM);
  for (const p of pages) {
    const trimW = pxToPt(p.pagePx.w), trimH = pxToPt(p.pagePx.h);
    const page = pdf.addPage([trimW + 2*bleed, trimH + 2*bleed]);
    const ox = bleed, oy = bleed;
    for (const im of p.images) {
      const buf = await fetch(im.url).then(r=>r.arrayBuffer());
      const ext = im.url.toLowerCase().split("?")[0].split(".").pop();
      const emb = ext==="png" ? await pdf.embedPng(buf) : await pdf.embedJpg(buf);
      const w = pxToPt(im.w), h = pxToPt(im.h);
      page.drawImage(emb, { x: ox + pxToPt(im.x), y: oy + (trimH - pxToPt(im.y) - h), width:w, height:h });
    }
    for (const t of (p.texts||[])) {
      const col = (t.color||"#111").replace("#",""); const n=parseInt(col.length===3?col.split("").map(c=>c+c).join(""):col,16);
      const r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255;
      const tw = t.text.length * (t.size*0.6);
      let x = ox + pxToPt(t.x);
      if (t.align==="center") x -= tw/2; if (t.align==="right") x -= tw;
      page.drawText(t.text, { x, y: oy + (trimH - pxToPt(t.y) - t.size), size: t.size, color: rgb(r,g,b) });
    }
    const mark = mmToPt(3.5);
    const L = (x:number,y:number,dx:number,dy:number)=>page.drawLine({start:{x,y}, end:{x:x+dx,y:y+dy}, thickness:0.5, color:rgb(0,0,0)});
    // traits de coupe aux 4 coins
    L(bleed, bleed-mark, 0, mark);           L(bleed, bleed, -mark, 0);
    L(bleed+trimW, bleed-mark, 0, mark);     L(bleed+trimW, bleed, mark, 0);
    L(bleed, bleed+trimH, 0, mark);          L(bleed, bleed+trimH, -mark, 0);
    L(bleed+trimW, bleed+trimH, 0, mark);    L(bleed+trimW, bleed+trimH, mark, 0);
  }
  return await pdf.save();
}

export { exportWithCrop as exportPdf };