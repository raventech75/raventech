import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

// GET /api/projects  -> liste des projets
export async function GET() {
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb
      .from("projects")
      .select("id,name,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ projects: data ?? [] }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/projects  -> créer un projet vide
export async function POST(req: NextRequest) {
  try {
    const payload: unknown = await req.json().catch(() => ({}));
    const name =
      typeof (payload as Record<string, unknown>)?.name === "string"
        ? ((payload as Record<string, unknown>).name as string)
        : "Nouveau projet";

    const sb = await supabaseServer();

    const id = nanoid();
    const { error } = await sb.from("projects").insert({
      id,
      name,
      size: { w: 30, h: 30, label: "30×30" },
      page_count: 10,
      background: { type: "solid", color1: "#ffffff" },
      bleed_mm: 5,
      safe_mm: 10,
    });
    if (error) throw error;

    const pageId = nanoid();
    const { error: ePage } = await sb
      .from("pages")
      .insert({ id: pageId, project_id: id, index: 0 });
    if (ePage) throw ePage;

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}