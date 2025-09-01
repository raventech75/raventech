import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  const base = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };

  // On crée la réponse et on y attache les cookies à supprimer
  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: 'sb-access-token',
    value: '',
    ...base,
    maxAge: 0, // supprime
  });

  res.cookies.set({
    name: 'sb-refresh-token',
    value: '',
    ...base,
    maxAge: 0, // supprime
  });

  return res;
}