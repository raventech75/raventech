'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/Browser';

export default function UpdatePasswordPage() {
  const [pwd, setPwd] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading(true);
    try {
      const { error } = await supabaseBrowser.auth.updateUser({ password: pwd });
      if (error) throw error;
      setMsg('Mot de passe mis à jour.');
      setTimeout(() => router.replace('/sign-in'), 1000);
    } catch (e: any) {
      setErr(e?.message || 'Échec de mise à jour');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-100 via-indigo-100 to-cyan-100 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-xl p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-slate-900">Définir un nouveau mot de passe</h1>
        <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Nouveau mot de passe" className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 focus:ring-4 focus:ring-fuchsia-200" />
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}
        <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 px-4 py-3 font-semibold text-white">{loading ? 'Mise à jour…' : 'Enregistrer'}</button>
      </form>
    </div>
  );
}