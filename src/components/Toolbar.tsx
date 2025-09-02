'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

/* --- Atomes UI : pill + 3D --- */

function PillBtn({
  onClick,
  title,
  children,
  active = false,
  disabled = false,
}: {
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        'h-8 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1',
        'outline-none transition active:translate-y-[1px]',
        'focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-500',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : active
          ? 'bg-gradient-to-b from-sky-400 to-sky-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_6px_12px_rgba(2,132,199,.35)]'
          : 'bg-gradient-to-b from-white to-slate-100 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_2px_6px_rgba(0,0,0,.08)] hover:from-white hover:to-white',
        'border border-slate-300',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function PillGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full border border-slate-200 bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,.06),inset_0_1px_0_rgba(255,255,255,.7)]">
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-8 px-2 rounded-full border border-slate-200 bg-white/90 text-xs text-slate-700 grid place-items-center shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_1px_3px_rgba(0,0,0,.05)]">
      {children}
    </div>
  );
}

/* --- Toolbar --- */

export default function Toolbar() {
  const st = useAlbumStore();

  const zoomPct = Math.round(st.zoom * 100);
  const onFit = () => window.dispatchEvent(new CustomEvent('album:zoom-fit'));
  const zoomIn = () => st.setZoom(Math.min(6, st.zoom * 1.1));
  const zoomOut = () => st.setZoom(Math.max(0.05, st.zoom / 1.1));
  const resetPan = () => st.resetPan();

  // Raccourcis clavier
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return;
      if (e.key.toLowerCase() === 'f') onFit();
      if (e.key.toLowerCase() === 'c') resetPan();
      if (e.key.toLowerCase() === 'p') st.openPreview();
      if ((e.ctrlKey || e.metaKey) && e.key === '=' ) zoomIn();
      if ((e.ctrlKey || e.metaKey) && e.key === '-' ) zoomOut();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [st.zoom]);

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-2 py-1 flex items-center gap-3 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        {/* Fichier */}
        <PillGroup>
          <PillBtn onClick={st.openPreview} title="Aperçu (P)">
            <span aria-hidden>👁️</span><span className="hidden sm:inline">Aperçu</span>
          </PillBtn>
          <PillBtn onClick={() => st.exportJpeg({ all: false })} title="Exporter la page (JPEG 300 dpi)">
            <span aria-hidden>🖼️</span><span className="hidden sm:inline">Page</span>
          </PillBtn>
          <PillBtn onClick={() => st.exportJpeg({ all: true })} title="Exporter l’album (JPEG 300 dpi)">
            <span aria-hidden>📚</span><span className="hidden sm:inline">Album</span>
          </PillBtn>
        </PillGroup>

        {/* Zoom & Pan */}
        <PillGroup>
          <PillBtn onClick={zoomOut} title="Zoom - (Ctrl/⌘ + -)">−</PillBtn>
          <Chip>{zoomPct}%</Chip>
          <PillBtn onClick={zoomIn} title="Zoom + (Ctrl/⌘ + =)">+</PillBtn>
          <PillBtn onClick={onFit} title="Adapter à l’écran (F)">
            <span aria-hidden>🪄</span><span className="hidden sm:inline">Fit</span>
          </PillBtn>
          <PillBtn onClick={resetPan} title="Recentrer (C)">
            <span aria-hidden>🎯</span><span className="hidden sm:inline">Centre</span>
          </PillBtn>
        </PillGroup>

        {/* Affichage */}
        <PillGroup>
          <PillBtn
            active={st.snapEnabled}
            onClick={st.toggleSnap}
            title="Aimantation (Snapping)"
          >
            <span aria-hidden>🧲</span><span className="hidden sm:inline">Snap</span>
          </PillBtn>
          <PillBtn
            active={st.showGuides}
            onClick={st.toggleGuides}
            title="Afficher les guides (marges + MILIEU)"
          >
            <span aria-hidden>🧭</span><span className="hidden sm:inline">Guides</span>
          </PillBtn>
          <PillBtn
            active={st.showRulers}
            onClick={st.toggleRulers}
            title="Afficher les règles (cm)"
          >
            <span aria-hidden>📏</span><span className="hidden sm:inline">Règles</span>
          </PillBtn>

          <div className="hidden md:inline-flex items-center gap-2 pl-1">
            <label className="text-xs text-slate-600">Snap</label>
            <input
              type="number"
              min={1}
              max={40}
              value={st.snapDistancePx}
              onChange={(e) => st.setSnapDistancePx(parseInt(e.target.value || '10', 10))}
              className="h-8 w-16 px-2 rounded-full border border-slate-300 bg-white/90 text-xs text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_1px_2px_rgba(0,0,0,.06)]"
              title="Distance d’aimantation (px écran)"
            />
            <span className="text-xs text-slate-600">px</span>
          </div>
        </PillGroup>

        {/* Infos compactes */}
        <div className="ml-auto inline-flex items-center gap-2">
          <Chip>{st.pages.length}p</Chip>
          <Chip>{st.size.w}×{st.size.h} cm • {st.dpi} dpi</Chip>
        </div>
      </div>
    </div>
  );
}