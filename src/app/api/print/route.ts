import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// ---------- Utils
function slugify(input: string): string {
  return (input || 'album')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase() || 'album';
}

function getSupabase() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase credentials are missing. Set SUPABASE_URL and SUPABASE_ANON_KEY (or SERVICE_ROLE).'
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------- Core
async function saveToSupabase(
  projectId: string,
  projectName: string,
  pdfBase64: string
) {
  const supabase = getSupabase();

  const bytes = Buffer.from(pdfBase64, 'base64');
  const filename = `${projectId}-${Date.now()}.pdf`;
  const bucket = 'prints';

  // 1) Upload to storage
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(filename, bytes, {
      contentType: 'application/pdf',
      upsert: false,
    });
  if (upErr) throw upErr;

  // 2) Get public URL or signed URL
  let publicUrl: string | null = null;
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    publicUrl = data?.publicUrl ?? null;
  } catch {}

  let signedUrl: string | null = null;
  if (!publicUrl) {
    const { data: s, error: sErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filename, 60 * 60 * 24 * 7);
    if (!sErr) signedUrl = s?.signedUrl ?? null;
  }

  // 3) Optional: record in DB
  try {
    const { error: insErr } = await supabase.from('prints').insert({
      project_id: projectId,
      project_name: projectName,
      file: filename,
      public_url: publicUrl,
      signed_url: signedUrl,
      created_at: new Date().toISOString(),
    });
    if (insErr) {
      console.warn('[api/print] insert warning:', insErr.message);
    }
  } catch {}

  return { filename, publicUrl, signedUrl };
}

// ---------- Handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // ✅ Correction : pas de mélange ?? et ||
    const projectId: string = String(body?.projectId ?? Date.now());
    const projectName: string = String(
      body?.projectName ?? slugify('Album')
    );
    const pdfBase64: string = String(body?.pdfBase64 ?? '');

    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'Missing pdfBase64 in body.' },
        { status: 400 }
      );
    }

    const saved = await saveToSupabase(projectId, projectName, pdfBase64);

    return NextResponse.json({ ok: true, projectId, projectName, ...saved });
  } catch (err: any) {
    console.error('[api/print] error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    getSupabase();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}