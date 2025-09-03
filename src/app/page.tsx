import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import EditorLayout from '@/components/EditorLayout';
import { Analytics } from "@vercel/analytics/next"

export default async function Page() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si pas connecté → /sign-in
  if (!session) {
    redirect('/sign-in');
  }

  // ✅ Si connecté → affiche directement l'éditeur
  return <EditorLayout />;
}