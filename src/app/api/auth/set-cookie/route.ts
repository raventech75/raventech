import { NextResponse } from "next/server";

type Body = { access_token: string; refresh_token: string };

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

  // 🔴 Nettoyage des cookies "host-only" (www.raventech.fr) s'ils existent
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
  // 🔴 Nettoyage des cookies sans domain explicite (au cas où)
  res.cookies.set({
    name: "sb-access-token",
    value: "",
    ...base,
    maxAge: 0,
  });
  res.cookies.set({
    name: "sb-refresh-token",
    value: "",
    ...base,
    maxAge: 0,
  });

  // ✅ Pose des cookies uniques sur le domaine canonique
  res.cookies.set({
    name: "sb-access-token",
    value: access_token,
    ...base,
    domain,
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });
  res.cookies.set({
    name: "sb-refresh-token",
    value: refresh_token,
    ...base,
    domain,
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });

  return res;
}