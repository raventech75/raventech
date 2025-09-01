// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data?.user) redirect('/sign-in?redirect=/dashboard');

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Bonjour {data.user.email}</h1>
      <p className="text-slate-600 mt-2">Bienvenue sur votre tableau de bord.</p>
    </main>
  );
}