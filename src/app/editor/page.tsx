'use client';

import dynamic from 'next/dynamic';

const EditorCanvas = dynamic(() => import('@/components/EditorCanvas'), {
  ssr: false, // ⬅️ empêche toute exécution côté serveur
  loading: () => (
    <div className="w-full h-[60vh] grid place-items-center text-slate-600">
      Chargement de l’éditeur…
    </div>
  ),
});

export default function EditorPage() {
  return <EditorCanvas />;
}