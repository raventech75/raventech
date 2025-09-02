import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

import { supabaseAdmin } from '@/lib/supabase-admin';

async function saveToSupabase(projectId: string, projectName: string, pdfBase64: string) {
  const bytes = Buffer.from(pdfBase64, 'base64');
  const filename = `${projectId}-${Date.now()}.pdf`;
  // 1) Upload to storage bucket 'prints'
  const { data: up, error: upErr } = await (supabaseAdmin as any).storage.from('prints').upload(filename, bytes, {
    contentType: 'application/pdf',
    upsert: false
  });
  if (upErr) throw upErr;
  const filePath = up?.path || filename;
  const { data: pub } = (supabaseAdmin as any).storage.from('prints').getPublicUrl(filePath);
  const publicUrl = pub?.publicUrl || null;

  // 2) Insert DB row into 'print_jobs'
  const { data: ins, error: insErr } = await (supabaseAdmin as any).from('print_jobs').insert({
    project_id: projectId,
    project_name: projectName,
    file_path: filePath,
    file_url: publicUrl,
    status: 'queued'
  }).select().single();
  if (insErr) throw insErr;
  return { filePath, publicUrl, job: ins };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // TODO: brancher ici votre logique réelle d'envoi à l'imprimeur (S3/Supabase/email/webhook)
    // Pour l'instant on valide simplement la réception.
    const saved = await saveToSupabase(String(body?.projectId || 'local'), String(body?.projectName || 'Album'), String(body?.pdfBase64 || ''));
    console.log('[PRINT]', {
      projectId: body?.projectId,
      projectName: body?.projectName,
      pdfBytes: body?.pdfBase64 ? (body.pdfBase64.length + ' chars') : 'absent', supabase: saved
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
