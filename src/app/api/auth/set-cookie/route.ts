// src/app/api/auth/set-cookie/route.ts
import { NextResponse } from "next/server";

type Body = { access_token: string; refresh_token: string };

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { access_token, refresh_token } = (await req.json()) as Body;
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  const isProd = process.env.NODE_ENV === "production";
  const domain = isProd ? ".raventech.fr" : undefined;

  const base = {
    httpOnly: true as const,
    sameSite: "none" as const,
    path: "/",
    secure: isProd,
  };

  const res = NextResponse.json({ ok: true });

  // Nettoyage des variantes éventuelles
  res.cookies.set({ name: "sb-access-token", value: "", ...base, maxAge: 0 });
  res.cookies.set({ name: "sb-refresh-token", value: "", ...base, maxAge: 0 });
  res.cookies.set({
    name: "sb-access-token",
    value: "",
    ...base,
    domain: "www.raventech.fr",
    maxAge: 0,
  });
  res.cookies.set({
    name: "sb-refresh-token",
    value: "",
    ...base,
    domain: "www.raventech.fr",
    maxAge: 0,
  });

  // Pose unique sur le domaine canonique
  res.cookies.set({
    name: "sb-access-token",
    value: access_token,
    ...base,
    domain,
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.set({
    name: "sb-refresh-token",
    value: refresh_token,
    ...base,
    domain,
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}