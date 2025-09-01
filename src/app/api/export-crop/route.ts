/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/export-crop/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exportWithCrop } from "@/lib/pdf";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const bytes = await exportWithCrop(payload);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="album-crop.pdf"`,
      },
    });
  } catch (e:any) {
    return NextResponse.json({ error: e.message||"error" }, { status: 500 });
  }
}