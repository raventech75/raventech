// app/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import EditorLayout from '@/components/EditorLayout';

export default async function Page() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si pas connecté → redirige vers /sign-in
  if (!session) {
    redirect('/sign-in');
  }

  // ✅ Si connecté → affiche ton éditeur comme avant
  return <EditorLayout />;
}