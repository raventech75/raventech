/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/projects/[id]/duplicate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

// ...
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const sb = await supabaseServer(); // ⬅️ await


    // 1) Charger le projet source
    const { data: project, error: eProj } = await sb
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (eProj) throw eProj;
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    // 2) Charger pages + items
    const [{ data: pages, error: ePages }, { data: items, error: eItems }] =
      await Promise.all([
        sb.from("pages").select("*").eq("project_id", id).order("index"),
        sb.from("items").select("*").eq("project_id", id),
      ]);

    if (ePages) throw ePages;
    if (eItems) throw eItems;

    // 3) Créer le nouveau projet
    const newProjectId = nanoid();
    const newProjectName = `${project.name} (copie)`;
    const { error: eInsProj } = await sb.from("projects").insert({
      id: newProjectId,
      name: newProjectName,
      size: project.size,
      page_count: project.page_count,
      background: project.background,
      bleed_mm: project.bleed_mm,
      safe_mm: project.safe_mm,
    });
    if (eInsProj) throw eInsProj;

    // 4) Dupliquer les pages avec nouveaux ids et mapping
    const pageIdMap = new Map<string, string>();
    const newPagesPayload =
      (pages || []).map((p: any, idx: number) => {
        const pid = nanoid();
        pageIdMap.set(p.id, pid);
        return { id: pid, project_id: newProjectId, index: idx };
      });

    if (newPagesPayload.length) {
      const { error: eInsPages } = await sb.from("pages").insert(newPagesPayload);
      if (eInsPages) throw eInsPages;
    }

    // 5) Dupliquer les items vers nouvelles pages
    const newItemsPayload =
      (items || []).map((it: any) => ({
        id: nanoid(),
        project_id: newProjectId,
        page_id: pageIdMap.get(it.page_id)!,
        kind: it.kind,
        data: it.data,
      }));

    if (newItemsPayload.length) {
      const { error: eInsItems } = await sb.from("items").insert(newItemsPayload);
      if (eInsItems) throw eInsItems;
    }

    return NextResponse.json({ ok: true, id: newProjectId }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Duplication échouée" },
      { status: 500 }
    );
  }
}