'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Toolbar from '@/components/Toolbar';
import LeftSidebar from '@/components/LeftSidebar';
import RightPanel from '@/components/RightPanel';
import { useAlbumStore } from '@/store/useAlbumStore';

// ⚠️ Le canvas Konva reste client-only
const EditorCanvas = dynamic(() => import('@/components/EditorCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[60vh] grid place-items-center text-slate-600">
      Chargement de l’éditeur…
    </div>
  ),
});

export default function EditorPage() {
  const st = useAlbumStore();
  // Adapte automatiquement le zoom à l’ouverture pour que la page tienne dans la fenêtre
  // (on le fait ici pour être sûr que tout le layout est connu)
  // NB: l’implémentation du calcul est dans EditorCanvas mais on force un premier fit ici
  // en dispatchant un event (EditorCanvas l’écoute).
  const fitToView = () => {
    window.dispatchEvent(new CustomEvent('raventech-fit'));
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 text-slate-900">
      {/* Top bar */}
      <Toolbar onFit={fitToView} />

      {/* 12 colonnes: 2 (gauche) / 8 (canvas) / 2 (droite) */}
      <div className="grid h-[calc(100vh-56px)] grid-cols-12 gap-3 px-3 pb-3">
        {/* Sidebar gauche */}
        <div className="col-span-12 md:col-span-2">
          <LeftSidebar />
        </div>

        {/* Zone centrale : le canvas DOIT rester centré */}
        <div className="col-span-12 md:col-span-8">
          <div className="h-full w-full overflow-auto">
            <div className="flex h-full w-full items-center justify-center">
              <Suspense fallback={<div className="p-6 text-slate-600">Chargement…</div>}>
                <EditorCanvas />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Panneau droite (import + carrousel) */}
        <div className="col-span-12 md:col-span-2">
          <RightPanel />
        </div>
      </div>
    </div>
  );
}