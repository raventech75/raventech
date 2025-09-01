import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.getUser();
    return NextResponse.json(
      { user: data?.user ?? null, error: error?.message ?? null },
      { status: 200 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ user: null, error: msg }, { status: 500 });
  }
}