/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { exportPdf } from "@/lib/pdf";

export const runtime = "nodejs";

type ExportPayload = unknown;

function isBlobLike(x: unknown): x is { arrayBuffer: () => Promise<ArrayBuffer> } {
  return !!x && typeof (x as any).arrayBuffer === "function";
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ExportPayload;

    const outUnknown: unknown = await exportPdf(payload as any);

    // Normalise en Uint8Array
    let bytes: Uint8Array;
    if (outUnknown instanceof Uint8Array) {
      bytes = outUnknown;
    } else if (isBlobLike(outUnknown)) {
      const ab = await outUnknown.arrayBuffer();
      bytes = new Uint8Array(ab);
    } else {
      throw new Error("exportPdf must return Uint8Array or Blob-like object");
    }

    // ⚠️ Convertit en ArrayBuffer 'propre' (BodyInit accepte ArrayBuffer)
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="raventech.pdf"',
        "Cache-Control": "no-store"
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}