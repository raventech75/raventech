/* eslint-disable @typescript-eslint/no-explicit-any */ 

'use client';
import React from 'react';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useAlbumStore } from '@/store/useAlbumStore';

type Proj = { id: string; name: string; created_at: string };

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Proj[]>([]);
  const [name, setName] = React.useState('');
  const st = useAlbumStore();

  const load = async () => {
    const { data } = await supabaseBrowser.from('projects').select('id,name,created_at').order('created_at', { ascending: false });
    setProjects(data || []);
  };
  React.useEffect(()=>{ load(); },[]);

  const create = async () => {
    const id = crypto.randomUUID();
    await supabaseBrowser.from('projects').insert({ id, name: name || 'Nouveau projet', size: st.size, page_count: st.pageCount, background: st.background, bleed_mm: st.bleedMm, safe_mm: st.safeMm });
    setName(''); await load();
  };

  const open = async (p: Proj) => {
    await st.loadFromSupabase(p.id);
    window.location.href = '/editor';
  };

  const duplicate = async (p: Proj) => {
    const newId = crypto.randomUUID();
    await supabaseBrowser.from('projects').insert({ id: newId, name: `${p.name} (copie)`, size: st.size, page_count: st.pageCount, background: st.background, bleed_mm: st.bleedMm, safe_mm: st.safeMm });
    // clone pages/items du projet source
    const { data: ps } = await supabaseBrowser.from('pages').select('*').eq('project_id', p.id).order('index');
    const { data: its } = await supabaseBrowser.from('items').select('*').eq('project_id', p.id);
    if (ps?.length) {
      const mapOldToNew: Record<string,string> = {};
      const pagesNew = ps.map((pg:any, idx:number)=> { const id = nanoid(); mapOldToNew[pg.id]=id; return { id, project_id: newId, index: idx }; });
      await supabaseBrowser.from('pages').insert(pagesNew);
      const itemsNew = (its||[]).map((it:any)=> ({ id: nanoid(), project_id: newId, page_id: mapOldToNew[it.page_id], kind: it.kind, data: it.data }));
      if (itemsNew.length) await supabaseBrowser.from('items').insert(itemsNew);
    }
    await load();
  };

  const remove = async (p: Proj) => {
    await supabaseBrowser.from('projects').delete().eq('id', p.id);
    await load();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-black p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Projets</h1>
          <Link className="rounded border border-slate-300 bg-white px-3 py-1" href="/editor">Ouvrir l’éditeur</Link>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input className="rounded border border-slate-300 px-3 py-2" placeholder="Nom du projet" value={name} onChange={(e)=>setName(e.target.value)} />
          <button className="rounded border border-slate-300 bg-white px-3 py-2" onClick={create}>+ Créer</button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p)=>(
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500">{new Date(p.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded border border-slate-300 bg-white px-2 py-1 text-sm" onClick={()=>open(p)}>Ouvrir</button>
                  <button className="rounded border border-slate-300 bg-white px-2 py-1 text-sm" onClick={()=>duplicate(p)}>Dupliquer</button>
                  <button className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-sm" onClick={()=>remove(p)}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
          {!projects.length && <p className="text-sm text-slate-500">Aucun projet.</p>}
        </div>
      </div>
    </div>
  );
}