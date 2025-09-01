import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Body = { access_token: string; refresh_token: string };

export async function POST(req: Request) {
  const jar = await cookies();
  const { access_token, refresh_token } = (await req.json()) as Body;

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  // Options cookies
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production", // ✅ requis en HTTPS prod
  };

  jar.set("sb-access-token", access_token, base);
  jar.set("sb-refresh-token", refresh_token, base);

  return NextResponse.json({ ok: true });
}