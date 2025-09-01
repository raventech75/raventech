import { NextResponse } from "next/server";

type Body = { access_token: string; refresh_token: string };

export async function POST(req: Request) {
  const { access_token, refresh_token } = (await req.json()) as Body;

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  const isProd = process.env.NODE_ENV === "production";

  // ⚠️ IMPORTANT : mets ici ton domaine canonique si tu utilises www.
  // Si ton site tourne sur www.raventech.fr, on met ".raventech.fr"
  // (valable pour l’apex ET le sous-domaine www).
  const cookieDomain = isProd ? ".raventech.fr" : undefined;

  const base = {
    httpOnly: true as const,
    sameSite: "none" as const, // nécessaire pour que le cookie soit envoyé après redirections
    path: "/",
    secure: isProd,            // requis en HTTPS prod
    domain: cookieDomain,      // couvre raventech.fr et www.raventech.fr
  };

  const res = NextResponse.json({ ok: true });

  // Access token (durée courte)
  res.cookies.set({
    name: "sb-access-token",
    value: access_token,
    ...base,
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });

  // Refresh token (durée plus longue)
  res.cookies.set({
    name: "sb-refresh-token",
    value: refresh_token,
    ...base,
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });

  return res;
}