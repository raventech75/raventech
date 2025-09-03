'use client';

import * as React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';
// Essayez d'abord cette variante (avec une minuscule)
import { supabaseBrowser } from '@/lib/supabase/browser';
// Si ça ne marche pas, essayez celle-ci :
// import { supabaseBrowser } from '@/lib/supabase/client';
// Ou encore celle-ci :
// import { supabaseBrowser } from '@/lib/supabase/supabase';

type ProjectRow = {
  id: string;
  name: string;
  size: { w: number; h: number };
  page_count: number;
  background: any | null;
  bleed_mm: { top: number; right: number; bottom: number; left: number } | null;
  safe_mm: { top: number; right: number; bottom: number; left: number } | null;
  created_at?: string | null;
};

export default function ProjectsPage() {
  const st = useAlbumStore();
  const [name, setName] = React.useState('');
  const [projects, setProjects] = React.useState<ProjectRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseBrowser
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects((data as ProjectRow[]) ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const create = async () => {
    setCreating(true);
    try {
      const id = crypto.randomUUID();

      // Construit des champs compatibles avec ton store
      const pageCount = st.pages.length;
      const background = st.pages[0]?.background ?? null;

      // safe_mm = marges actuelles converties en mm
      const safe_mm = st.marginsCm
        ? {
            top: (st.marginsCm.top ?? 0) * 10,
            right: (st.marginsCm.right ?? 0) * 10,
            bottom: (st.marginsCm.bottom ?? 0) * 10,
            left: (st.marginsCm.left ?? 0) * 10,
          }
        : null;

      // bleed_mm défaut (3 mm tout autour)
      const bleed_mm = { top: 3, right: 3, bottom: 3, left: 3 };

      const payload = {
        id,
        name: name || 'Nouveau projet',
        size: st.size,
        page_count: pageCount,
        background,
        bleed_mm,
        safe_mm,
      };

      const { error } = await supabaseBrowser.from('projects').insert(payload);
      if (error) throw error;

      setName('');
      await load();
    } catch (e) {
      console.error(e);
      alert('Création échouée. Regarde la console pour le détail.');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce projet ?')) return;
    try {
      const { error } = await supabaseBrowser.from('projects').delete().eq('id', id);
      if (error) throw error;
      await load();
    } catch (e) {
      console.error(e);
      alert('Suppression échouée.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-800">Mes projets</h1>

      <div className="mt-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du projet"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={create}
          disabled={creating}
          className="rounded-md bg-slate-800 text-white px-4 py-2 text-sm hover:bg-slate-900 disabled:opacity-50"
        >
          {creating ? 'Création…' : 'Créer'}
        </button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="text-slate-500 text-sm">Chargement…</div>
        ) : projects.length === 0 ? (
          <div className="text-slate-500 text-sm">Aucun projet pour le moment.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Nom</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Format</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Pages</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Créé le</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">
                      {p.size?.w}×{p.size?.h} cm
                    </td>
                    <td className="px-3 py-2">{p.page_count}</td>
                    <td className="px-3 py-2">
                      {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {/* Adapte ce lien à ta route d'édition si besoin */}
                      <a
                        href={`/editor?id=${p.id}`}
                        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 mr-2 hover:bg-slate-50"
                      >
                        Ouvrir
                      </a>
                      <button
                        onClick={() => remove(p.id)}
                        className="inline-flex items-center rounded-md border border-red-300 text-red-700 px-3 py-1.5 hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}