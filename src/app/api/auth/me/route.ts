// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const jar = await cookies();
    const access = jar.get("sb-access-token")?.value ?? null;
    const refresh = jar.get("sb-refresh-token")?.value ?? null;

    const sb = await supabaseServer();
    const { data, error } = await sb.auth.getUser();
    return NextResponse.json(
      {
        user: data?.user ?? null,
        error: error?.message ?? null,
        // mini-debug pour confirmer côté serveur
        _debug: {
          hasAccessCookie: !!access,
          hasRefreshCookie: !!refresh,
          accessPrefix: access ? access.slice(0, 16) : null,
        },
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ user: null, error: msg }, { status: 500 });
  }
}