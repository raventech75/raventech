'use client';

import * as React from 'react';
import LeftLibrary from '@/components/LeftLibrary';
import EditorCanvas from '@/components/EditorCanvas';
import CanvasToolDock from '@/components/CanvasToolDock';
import PageStrip from '@/components/PageStrip';
import Sidebar from '@/components/Sidebar';
import PreviewModal from '@/components/PreviewModal';

/**
 * Layout éditeur
 * - Canvas centré, min-w-0 pour éviter les débordements
 * - LeftLibrary dockée à gauche (scrollable)
 * - Sidebar en drawer responsive à droite (ouvert/fermé)
 * - Barre d’outils du canvas déjà déportée sous le canvas
 * - PreviewModal rendu au niveau racine du layout pour recouvrir tout l’écran
 */
export default function EditorLayout() {
  const [rightOpen, setRightOpen] = React.useState<boolean>(false);

  // Ouvrir/fermer via évènements globaux si besoin (depuis Toolbar/menus)
  React.useEffect(() => {
    const open = () => setRightOpen(true);
    const close = () => setRightOpen(false);
    const toggle = () => setRightOpen((v) => !v);
    window.addEventListener('album:open-settings' as any, open);
    window.addEventListener('album:close-settings' as any, close);
    window.addEventListener('album:toggle-settings' as any, toggle);
    return () => {
      window.removeEventListener('album:open-settings' as any, open);
      window.removeEventListener('album:close-settings' as any, close);
      window.removeEventListener('album:toggle-settings' as any, toggle);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50">
      {/* Zone principale : 2 colonnes (bibliothèque / espace de travail) */}
      <div className="flex-1 w-full h-full grid grid-cols-[minmax(240px,300px)_1fr] lg:grid-cols-[minmax(260px,320px)_1fr] overflow-hidden">
        {/* Colonne gauche : bibliothèque */}
        <aside className="h-full overflow-y-auto border-r border-slate-200 bg-white">
          <div className="p-3 sm:p-4">
            <LeftLibrary />
          </div>
        </aside>

        {/* Colonne centre : canvas + outils + bande de pages */}
        <section className="min-w-0 flex flex-col overflow-hidden">
          {/* Bande supérieure légère (bouton réglages) */}
          <div className="px-3 sm:px-4 py-2 flex items-center gap-2 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 border-b border-slate-200">
            <div className="text-[13px] text-slate-600">Espace de travail</div>
            <div className="flex-1" />
            <button
              className="h-8 px-3 rounded-full border border-slate-300 text-[12px] text-slate-700 bg-white hover:bg-slate-50"
              onClick={() => setRightOpen(true)}
              title="Ouvrir les réglages"
            >
              Réglages
            </button>
          </div>

          {/* Canvas centré et responsive */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-[280px] min-w-0">
              {/* EditorCanvas gère son fit-to-window avec ResizeObserver et events */}
              <EditorCanvas />
            </div>

            {/* Outils sous le canvas */}
            <CanvasToolDock />

            {/* Bande de miniatures */}
            <PageStrip />
          </div>
        </section>
      </div>

      {/* Drawer droite (réglages / Sidebar) */}
      <RightDrawer open={rightOpen} onClose={() => setRightOpen(false)}>
        <Sidebar />
      </RightDrawer>

      {/* Modal d’aperçu global (recouvre tout l’écran) */}
      <PreviewModal />
    </div>
  );
}

/**
 * Drawer responsive à droite.
 * - Largeur : min(92vw, 420px)
 * - Overlay cliquable pour fermer
 * - Scroll interne indépendant
 * - Safe-areas iOS gérés
 */
function RightDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-200 z-[48] ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Panneau */}
      <div
        className={`
          fixed inset-y-0 right-0 z-[49]
          bg-white shadow-xl border-l border-slate-200
          transition-transform duration-300 will-change-transform
        `}
        style={{
          width: 'min(92vw, 420px)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* En-tête compact avec bouton fermer */}
        <div className="sticky top-0 z-10 px-3 sm:px-4 py-2 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200 flex items-center">
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full grid place-items-center border border-slate-300 text-slate-700 hover:bg-slate-50"
            aria-label="Fermer les réglages"
            title="Fermer"
          >
            ✕
          </button>
          <div className="ml-2 text-[13px] text-slate-600">Réglages</div>
          <div className="flex-1" />
        </div>

        {/* Contenu scrollable */}
        <div
          className="h-[calc(100vh-48px)] overflow-y-auto px-3 sm:px-4 pb-6"
          style={{
            paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 16px))',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}