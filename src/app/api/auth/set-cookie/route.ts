import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type Body = { access_token: string; refresh_token: string };

export async function POST(req: Request) {
  // ✅ En route handler Next 15, cookies() peut être async
  const jar = await cookies();

  const { access_token, refresh_token } = (await req.json()) as Body;

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  const base = {
    httpOnly: true,
    sameSite: "none" as const, // important pour que le cookie soit envoyé après redirections
    path: "/",
    secure: process.env.NODE_ENV === "production", // requis en prod (HTTPS)
  };

  // Access token (durée courte)
  jar.set("sb-access-token", access_token, {
    ...base,
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });

  // Refresh token (durée plus longue)
  jar.set("sb-refresh-token", refresh_token, {
    ...base,
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });

  return NextResponse.json({ ok: true });
}