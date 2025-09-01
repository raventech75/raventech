// /src/app/api/export-pdf/route.ts
import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";

export const runtime = "nodejs";

type Payload = {
  images: string[];                 // dataURL PNG par page (1..N)
  pagePx: { w: number; h: number }; // dimensions pixels à ton dpi
  dpi?: number;                     // défaut 300
  cropMarks?: boolean;              // traits de coupe
  bleedMM?: number;                 // (optionnel, non utilisé ici)
};

function pxToPt(px: number, dpi: number) {
  // 1 inch = dpi px = 72 pt
  return (px / dpi) * 72;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    const dpi = body.dpi ?? 300;
    const pageWpt = pxToPt(body.pagePx.w, dpi);
    const pageHpt = pxToPt(body.pagePx.h, dpi);

    const pdf = await PDFDocument.create();

    for (const dataUrl of body.images) {
      const pngBytes = Buffer.from(
        dataUrl.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );
      const img = await pdf.embedPng(pngBytes);
      const page = pdf.addPage([pageWpt, pageHpt]);

      page.drawImage(img, {
        x: 0,
        y: 0,
        width: pageWpt,
        height: pageHpt,
      });

      if (body.cropMarks) {
        const m = 10; // 10pt hors page
        const color = rgb(0, 0, 0);
        const lw = 0.6;

        // haut-gauche
        page.drawLine({ start: { x: -m, y: 0 }, end: { x: m, y: 0 }, color, thickness: lw });
        page.drawLine({ start: { x: 0, y: -m }, end: { x: 0, y: m }, color, thickness: lw });
        // haut-droit
        page.drawLine({ start: { x: pageWpt - m, y: 0 }, end: { x: pageWpt + m, y: 0 }, color, thickness: lw });
        page.drawLine({ start: { x: pageWpt, y: -m }, end: { x: pageWpt, y: m }, color, thickness: lw });
        // bas-gauche
        page.drawLine({ start: { x: -m, y: pageHpt }, end: { x: m, y: pageHpt }, color, thickness: lw });
        page.drawLine({ start: { x: 0, y: pageHpt - m }, end: { x: 0, y: pageHpt + m }, color, thickness: lw });
        // bas-droit
        page.drawLine({ start: { x: pageWpt - m, y: pageHpt }, end: { x: pageWpt + m, y: pageHpt }, color, thickness: lw });
        page.drawLine({ start: { x: pageWpt, y: pageHpt - m }, end: { x: pageWpt, y: pageHpt + m }, color, thickness: lw });
      }
    }

    const bytes = await pdf.save(); // Uint8Array (peut référencer un SharedArrayBuffer)

    // ✅ Copie dans un nouveau Uint8Array garanti sur un ArrayBuffer "pur"
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    const ab: ArrayBuffer = copy.buffer;

    // ✅ Envelopper en Blob (BodyInit compatible)
    const blob = new Blob([ab], { type: "application/pdf" });

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="raventech-album.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg || "Export PDF failed" }, { status: 400 });
  }
}