import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const isProd = process.env.NODE_ENV === "production";
  const domain = isProd ? ".raventech.fr" : undefined;

  const res = NextResponse.redirect(
    new URL("/sign-in", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  );

  const base = {
    httpOnly: true as const,
    sameSite: "none" as const,
    secure: isProd,
    path: "/",
    domain,
  };

  // supprime les cookies
  res.cookies.set({ name: "sb-access-token", value: "", maxAge: 0, ...base });
  res.cookies.set({ name: "sb-refresh-token", value: "", maxAge: 0, ...base });

  return res;
}