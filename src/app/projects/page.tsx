'use client';
import React from 'react';
import Link from 'next/link';

type Proj = { id: string; name: string; created_at: string };

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Proj[]>([]);
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Pour l'instant, on simule des projets
  React.useEffect(() => {
    // Simuler quelques projets
    setProjects([
      { id: '1', name: 'Album Mariage', created_at: new Date().toISOString() },
      { id: '2', name: 'Photos Vacances', created_at: new Date().toISOString() },
    ]);
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    
    // Simuler la création d'un projet
    const newProject = {
      id: crypto.randomUUID(),
      name: name.trim(),
      created_at: new Date().toISOString()
    };
    
    setProjects(prev => [newProject, ...prev]);
    setName('');
    setLoading(false);
  };

  const remove = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-black p-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mes Projets</h1>
          <Link className="rounded border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50" href="/editor">
            Ouvrir l'éditeur
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input 
            className="rounded border border-slate-300 px-3 py-2 flex-1" 
            placeholder="Nom du nouveau projet" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <button 
            className="rounded border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50 disabled:opacity-50" 
            onClick={create}
            disabled={loading || !name.trim()}
          >
            {loading ? 'Création...' : '+ Créer'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="font-semibold text-lg mb-1">{p.name}</div>
                  <div className="text-xs text-slate-500 mb-3">
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link 
                    href="/editor" 
                    className="flex-1 text-center rounded bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700 transition-colors"
                  >
                    Ouvrir
                  </Link>
                  <button 
                    className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    onClick={() => {
                      const duplicate = { ...p, id: crypto.randomUUID(), name: `${p.name} (copie)` };
                      setProjects(prev => [duplicate, ...prev]);
                    }}
                  >
                    Dupliquer
                  </button>
                  <button 
                    className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm hover:bg-rose-100"
                    onClick={() => remove(p.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">Aucun projet pour le moment</p>
            <p className="text-sm text-slate-400">Créez votre premier projet ci-dessus</p>
          </div>
        )}
      </div>
    </div>
  );
}