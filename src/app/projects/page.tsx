'use client';

import * as React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';
import { supabaseBrowser } from '@/lib/supabase/browser';

type ProjectRow = {
  id: string;
  name: string;
  size: { w: number; h: number };
  page_count: number;
  background: any;
  bleed_mm: number;
  safe_mm: number;
  created_at?: string;
};

export default function ProjectsPage() {
  const st = useAlbumStore();
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<ProjectRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    const { data, error } = await supabaseBrowser
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setRows((data ?? []) as ProjectRow[]);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setLoading(true);
    setError(null);
    try {
      const id = crypto.randomUUID();
      const bg =
        st.pages[st.currentPageIndex]?.background ??
        st.pages[0]?.background ??
        null;

      const payload: Omit<ProjectRow, 'created_at'> = {
        id,
        name: name || 'Nouveau projet',
        size: st.size,
        page_count: st.pages.length,
        background: bg,
        bleed_mm: st.bleedMm,
        safe_mm: st.safeMm,
      };

      const { error } = await supabaseBrowser.from('projects').insert(payload as any);
      if (error) throw error;

      setName('');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">Mes projets</h1>

      <div className="rounded-lg border border-slate-200 p-3 flex flex-wrap items-center gap-2 bg-white">
        <input
          type="text"
          placeholder="Nom du projet"
          className="h-9 px-3 rounded-md border border-slate-300 min-w-[240px]"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={create}
          disabled={loading}
          className="h-9 px-4 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
          title="Créer un nouveau projet"
        >
          {loading ? 'Création…' : 'Créer'}
        </button>

        <div className="ml-auto text-sm text-slate-600">
          Format actuel : {st.size.w}×{st.size.h} cm • Pages : {st.pages.length} •
          Bleed : {st.bleedMm} mm • Safe : {st.safeMm} mm
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 text-rose-700 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-2">Nom</th>
              <th className="text-left p-2">Format</th>
              <th className="text-left p-2">Pages</th>
              <th className="text-left p-2">Bleed / Safe</th>
              <th className="text-left p-2">Créé</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-2">{r.name}</td>
                <td className="p-2">
                  {r.size?.w}×{r.size?.h} cm
                </td>
                <td className="p-2">{r.page_count}</td>
                <td className="p-2">
                  {r.bleed_mm} mm / {r.safe_mm} mm
                </td>
                <td className="p-2 text-slate-500">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={5}>
                  Aucun projet pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}