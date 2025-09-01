'use client';

import React, { useState } from 'react';

type Props = {
  item: any;
  onClose: () => void;
  onChange: (patch: any) => void;
};

export default function PhotoEditorModal({ item, onClose, onChange }: Props) {
  const [local, setLocal] = useState<any>({
    crop: item.crop || { x: 0, y: 0, w: item.ow || item.width, h: item.oh || item.height },
    opacity: item.opacity ?? 1,
    radius: item.radius ?? 0,
    shadowBlur: item.shadowBlur ?? 0,
  });

  const commit = () => onChange(local);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="font-medium">Édition photo</div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm hover:bg-slate-100">Fermer</button>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between gap-2">
              <span>Opacité</span>
              <input
                type="range" min={0} max={1} step={0.01}
                value={local.opacity}
                onChange={(e) => setLocal((s: any) => ({ ...s, opacity: Number(e.target.value) }))}
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Arrondi</span>
              <input
                type="range" min={0} max={40} step={1}
                value={local.radius}
                onChange={(e) => setLocal((s: any) => ({ ...s, radius: Number(e.target.value) }))}
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Ombre</span>
              <input
                type="range" min={0} max={20} step={1}
                value={local.shadowBlur}
                onChange={(e) => setLocal((s: any) => ({ ...s, shadowBlur: Number(e.target.value) }))}
              />
            </label>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-4 font-medium mt-2">Recadrage (px)</div>
            {(['x','y','w','h'] as const).map(k => (
              <label key={k} className="flex items-center justify-between gap-2">
                <span className="w-8 uppercase">{k}</span>
                <input
                  type="number"
                  className="w-28 rounded border border-slate-300 px-2 py-1"
                  value={local.crop[k]}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setLocal((s: any) => ({ ...s, crop: { ...s.crop, [k]: v } }));
                  }}
                />
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button onClick={onClose} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Annuler</button>
            <button onClick={() => { commit(); onClose(); }} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">Appliquer</button>
          </div>
        </div>
      </div>
    </div>
  );
}