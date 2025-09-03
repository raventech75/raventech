'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

/** Garantit un objet linear { from, to, angle } entièrement typé */
function ensureLinear(
  partial?: Partial<{ from: string; to: string; angle: number }>
): { from: string; to: string; angle: number } {
  const from = (partial?.from ?? '#ffffff').trim() || '#ffffff';
  const to = (partial?.to ?? '#000000').trim() || '#000000';
  const angle = typeof partial?.angle === 'number' ? partial!.angle : 90;
  return { from, to, angle };
}

/** Petit helper d'UI pour disposer une étiquette et un champ sur une ligne */
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export default function BackgroundPanel() {
  const st = useAlbumStore();

  // Page courante
  const page = st.pages[st.currentPageIndex];
  // On suppose que la page a un champ "background" de forme:
  // { fill?: string; image?: string; linear?: { from: string; to: string; angle: number } }
  const bg = (page as any).background ?? {};

  // setBg merge proprement et notifie le store si nécessaire
  const setBg = (patch: any) => {
    const next = { ...(page as any).background, ...patch };
    (page as any).background = next;
    // Notifs facultatives si le store les expose
    (st as any).updatePage?.(page.id, { background: next });
    (st as any).touch?.();
    (st as any).saveProject?.();
    (st as any).rerender?.();
  };

  const clearBg = () => {
    (page as any).background = {};
    (st as any).updatePage?.(page.id, { background: {} });
    (st as any).touch?.();
  };

  // Valeurs sûres pour le rendu
  const fill: string | undefined = bg.fill;
  const linear = bg.linear ? ensureLinear(bg.linear) : undefined;
  const image: string | undefined = bg.image;

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">Arrière-plan</div>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:shadow"
          onClick={clearBg}
          title="Réinitialiser l’arrière-plan"
        >
          Réinitialiser
        </button>
      </div>

      {/* Couleur pleine */}
      <Row label="Couleur unie">
        <input
          type="color"
          value={fill ?? '#ffffff'}
          onChange={(e) => setBg({ fill: e.target.value })}
          className="h-8 w-10 cursor-pointer rounded-md border border-slate-300"
          aria-label="Couleur de fond"
        />
        <input
          type="text"
          value={fill ?? '#ffffff'}
          onChange={(e) => setBg({ fill: e.target.value })}
          className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          placeholder="#ffffff"
        />
        <button
          type="button"
          className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:shadow"
          onClick={() => setBg({ fill: undefined })}
        >
          Aucune
        </button>
      </Row>

      <div className="my-4 h-px bg-slate-200" />

      {/* Dégradé linéaire */}
      <div className="mb-2 text-xs font-medium text-slate-600">Dégradé linéaire</div>

      <Row label="Angle (°)">
        <input
          type="number"
          value={linear?.angle ?? 90}
          onChange={(e) =>
            setBg({
              linear: ensureLinear({
                ...(bg.linear ?? {}),
                angle: parseInt(e.target.value || '0', 10),
              }),
            })
          }
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:shadow"
          onClick={() =>
            setBg({
              linear: undefined,
            })
          }
        >
          Désactiver
        </button>
      </Row>

      <Row label="Depuis">
        <input
          type="color"
          value={linear?.from ?? '#ffffff'}
          onChange={(e) =>
            setBg({
              linear: ensureLinear({
                ...(bg.linear ?? {}),
                from: e.target.value,
              }),
            })
          }
          className="h-8 w-10 cursor-pointer rounded-md border border-slate-300"
          aria-label="Couleur départ"
        />
        <input
          type="text"
          value={linear?.from ?? '#ffffff'}
          onChange={(e) =>
            setBg({
              linear: ensureLinear({
                ...(bg.linear ?? {}),
                from: e.target.value,
              }),
            })
          }
          className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          placeholder="#ffffff"
        />
      </Row>

      <Row label="Vers">
        <input
          type="color"
          value={linear?.to ?? '#000000'}
          onChange={(e) =>
            setBg({
              linear: ensureLinear({
                ...(bg.linear ?? {}),
                to: e.target.value,
              }),
            })
          }
          className="h-8 w-10 cursor-pointer rounded-md border border-slate-300"
          aria-label="Couleur arrivée"
        />
        <input
          type="text"
          value={linear?.to ?? '#000000'}
          onChange={(e) =>
            setBg({
              linear: ensureLinear({
                ...(bg.linear ?? {}),
                to: e.target.value,
              }),
            })
          }
          className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          placeholder="#000000"
        />
      </Row>

      <div className="my-4 h-px bg-slate-200" />

      {/* Image de fond */}
      <div className="mb-2 text-xs font-medium text-slate-600">Image</div>
      <Row label="URL">
        <input
          type="url"
          value={image ?? ''}
          onChange={(e) => setBg({ image: e.target.value || undefined })}
          placeholder="https://…"
          className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:shadow"
          onClick={() => setBg({ image: undefined })}
        >
          Enlever
        </button>
      </Row>

      {/* Aperçu */}
      <div className="mt-4">
        <div className="mb-1 text-xs font-medium text-slate-600">Aperçu</div>
        <div
          className="h-24 w-full rounded-lg border border-slate-200"
          style={{
            background:
              image
                ? `url(${image}) center/cover no-repeat`
                : linear
                ? `linear-gradient(${linear.angle}deg, ${linear.from}, ${linear.to})`
                : fill
                ? fill
                : 'transparent',
          }}
        />
      </div>
    </div>
  );
}