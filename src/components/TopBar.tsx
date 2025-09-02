'use client';

import React from 'react';
import { useAlbumStore, ALBUM_FORMATS } from '@/store/useAlbumStore';

function Pill({
  children, onClick, variant = 'primary', disabled = false, title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'soft';
  disabled?: boolean;
  title?: string;
}) {
  const base = 'inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[12px] whitespace-nowrap transition shadow-sm focus:outline-none';
  const styles =
    variant === 'primary'
      ? 'bg-sky-600 text-white hover:bg-sky-700'
      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50';
  return (
    <button type="button" title={title} onClick={disabled ? undefined : onClick}
      className={`${base} ${styles} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      {children}
    </button>
  );
}

export default function TopBar() {
  const st = useAlbumStore();
  const fmt =
    ALBUM_FORMATS.find((f) => f.open.w === st.size.w && f.open.h === st.size.h) ||
    { label: `${st.size.w}×${st.size.h} cm (ouvert)` };

  const zoomPct = Math.round(st.zoom * 100);
  const pageLabel = `${st.currentPageIndex + 1}p`;

  const onZoom = (factor: number) =>
    st.setZoom(Math.max(5, Math.min(600, zoomPct * factor)) / 100);

  const onFit = () => window.dispatchEvent(new CustomEvent('album:zoom-fit'));
  const onCenter = () => window.dispatchEvent(new CustomEvent('album:center'));

  const undoDisabled = st.historyIndex <= 0;
  const redoDisabled = st.historyIndex < 0 || st.historyIndex >= st.history.length - 1;

  // Raccourci “C” pour centrer
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c') onCenter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-[1600px] px-4 py-2.5 flex items-center gap-2">
        {/* Zoom */}
        <div className="flex items-center gap-2">
          <Pill variant="soft" onClick={() => onZoom(1 / 1.1)} title="Zoom -">−</Pill>
          <div className="rounded-full border border-slate-300 bg-white text-slate-700 text-[12px] px-2 py-1.5">
            {zoomPct}%
          </div>
          <Pill variant="soft" onClick={() => onZoom(1.1)} title="Zoom +">+</Pill>
          <Pill variant="primary" onClick={onFit} title="Adapter à la fenêtre">Adapter</Pill>
          <Pill variant="soft" onClick={onCenter} title="Centrer (sans changer le zoom)">Centrer</Pill>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        {/* Infos */}
        <div className="flex items-center gap-2 text-[12px] text-slate-600">
          <span className="rounded-full bg-slate-900 text-white px-2 py-1">{pageLabel}</span>
          <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-1">
            {fmt.label?.replace(' (fermé)', '')} • {st.size.w}×{st.size.h} cm • {st.dpi} dpi
          </span>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-2">
          <Pill variant="soft" onClick={st.undo} disabled={undoDisabled} title="Annuler">↶ Annuler</Pill>
          <Pill variant="soft" onClick={st.redo} disabled={redoDisabled} title="Rétablir">↷ Rétablir</Pill>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <Toggle label="Guides" on={st.showGuides} onClick={st.toggleGuides} />
          <Toggle label="Règles" on={st.showRulers} onClick={st.toggleRulers} />
          <Toggle label="Snap"   on={st.snapEnabled} onClick={st.toggleSnap} />
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        {/* Export */}
        <div className="ml-auto flex items-center gap-2">
          <Pill variant="soft" onClick={() => st.exportJpeg({ all: false })} title="Exporter la page en JPEG 300dpi">
            Export page
          </Pill>
          <Pill variant="primary" onClick={() => st.exportJpeg({ all: true })} title="Exporter toutes les pages en JPEG 300dpi">
            Export tout
          </Pill>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12px] border transition shadow-sm ${
        on ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
      }`}
      title={label}>
      {label}
    </button>
  );
}