import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  // supprime les 2 cookies (domain .raventech.fr en prod)
  const isProd = process.env.NODE_ENV === "production";
  const domain = isProd ? ".raventech.fr" : undefined;
  const base = { path: "/", httpOnly: true as const, sameSite: "none" as const, secure: isProd, domain };

  res.cookies.set({ name: "sb-access-token", value: "", maxAge: 0, ...base });
  res.cookies.set({ name: "sb-refresh-token", value: "", maxAge: 0, ...base });

  return res;
}