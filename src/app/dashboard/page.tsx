// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic'; // ✅ évite le prerender/caching
export const revalidate = 0;

export default async function DashboardPage() {
  const sb = await supabaseServer();

  // 🔎 Lis l'utilisateur côté serveur via cookies HTTPOnly
  const { data, error } = await sb.auth.getUser();
  const user = data?.user ?? null;

  if (!user) {
    redirect('/sign-in?redirect=/dashboard');
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Bonjour {user.email}</h1>
      <p className="text-slate-600 mt-2">Bienvenue sur votre tableau de bord RavenTech.</p>
      {/* … ton contenu */}
    </main>
  );
}