import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Body = { access_token: string; refresh_token: string };

export async function POST(req: Request) {
  const jar = await cookies(); // Next 15
  const { access_token, refresh_token } = (await req.json()) as Body;

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  // Cookies attendus par @supabase/ssr
  jar.set("sb-access-token", access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  jar.set("sb-refresh-token", refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}