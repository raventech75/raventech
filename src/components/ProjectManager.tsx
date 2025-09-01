/* eslint-disable @typescript-eslint/no-explicit-any */
// /components/ProjectManager.tsx
"use client";
import React from "react";

type Project = { id: string; name: string; created_at: string; updated_at: string };

export default function ProjectManager({
  onOpen,
}:{
  onOpen: (id: string)=>void;
}) {
  const [items, setItems] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/projects");
    const data = await res.json();
    setItems(data.projects ?? []);
    setLoading(false);
  }
  React.useEffect(()=> { refresh(); }, []);

  async function duplicate(id: string) {
    await fetch(`/api/projects/${id}/duplicate`, { method: "POST" });
    await refresh();
  }
  async function remove(id: string) {
    if (!confirm("Supprimer ce projet ?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Projets</h3>
        <button className="text-sm opacity-70" onClick={refresh}>↻</button>
      </div>
      {loading ? <div className="text-sm opacity-70">Chargement…</div> : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map(p=>(
            <div key={p.id} className="rounded-xl border px-3 py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs opacity-60">Modifié {new Date(p.updated_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>onOpen(p.id)} className="px-2 py-1 text-xs rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black">Ouvrir</button>
                <button onClick={()=>duplicate(p.id)} className="px-2 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800">Dupliquer</button>
                <button onClick={()=>remove(p.id)} className="px-2 py-1 text-xs rounded-lg bg-rose-600 text-white">Suppr.</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}