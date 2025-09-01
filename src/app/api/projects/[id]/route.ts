/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

// DELETE /api/projects/:id
// ...
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const sb = await supabaseServer(); // ⬅️ await
    // ...

    // supprimer items -> pages -> projet (ordre pour contraintes FK éventuelles)
    const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
      sb.from("items").delete().eq("project_id", id),
      sb.from("pages").delete().eq("project_id", id),
      sb.from("projects").delete().eq("id", id),
    ]);

    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Suppression échouée" },
      { status: 500 }
    );
  }
}