'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

/**
 * SelectionToolbar
 * - S’adapte à différents schémas de store:
 *    • Sélection: selectedIds[] | selectedItemId | selectedId
 *    • MAJ item:  updateItem(pageIndex, itemId, patch) | updateSelected(patch)
 *    • Duplication: duplicateItem?(pageIndex, itemId) ou clone local
 *    • Suppression : removeItem?(pageIndex, itemId) ou remove local
 *    • Calques : bringToFront?/sendToBack?/bringForward?/sendBackward? ou re-order local
 * - Homothétie : toggle lockAspect et respecté côté EditorCanvas (lockAspect/⇧)
 * - Inclut alignements et distribution simple en fallback (si pas d’actions dédiées)
 */

type NumInputProps = {
  value: number | undefined;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
  disabled?: boolean;
  title?: string;
};

function NumInput({
  value,
  min = -9999,
  max = 9999,
  step = 1,
  onChange,
  className = '',
  disabled,
  title,
}: NumInputProps) {
  const [txt, setTxt] = React.useState(value ?? 0);
  React.useEffect(() => {
    setTxt(value ?? 0);
  }, [value]);

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={txt}
      title={title}
      disabled={disabled}
      onChange={(e) => setTxt(Number(e.target.value))}
      onBlur={() => {
        let v = Number(txt);
        if (Number.isNaN(v)) v = value ?? 0;
        v = Math.max(min, Math.min(max, v));
        onChange(v);
      }}
      className={
        'h-8 w-[80px] rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300 ' +
        className
      }
    />
  );
}

export default function SelectionToolbar() {
  const st = useAlbumStore();

  const page = st.pages[st.currentPageIndex];

  // Résolution sélection courante robuste
  const selectedIds: string[] =
    (st as any).selectedIds && Array.isArray((st as any).selectedIds)
      ? (st as any).selectedIds
      : (st as any).selectedItemId
      ? [(st as any).selectedItemId]
      : (st as any).selectedId
      ? [(st as any).selectedId]
      : [];

  if (!page || !selectedIds.length) return null;

  const selectedItems = page.items.filter((it: any) =>
    selectedIds.includes(it.id)
  );

  if (!selectedItems.length) return null;

  const item = selectedItems[0] as any; // item principal (ex. premier sélectionné)

  // Helpers MAJ item robustes
  const patchItem = (patch: Partial<any>) => {
    if (typeof (st as any).updateItem === 'function') {
      (st as any).updateItem(st.currentPageIndex, item.id, patch);
    } else if (typeof (st as any).updateSelected === 'function') {
      (st as any).updateSelected(patch);
    } else {
      // fallback brut — maj locale (à éviter en prod)
      const pages = [...st.pages];
      const pg = pages[st.currentPageIndex];
      if (!pg) return;
      pg.items = pg.items.map((it: any) => (it.id === item.id ? { ...it, ...patch } : it));
      (st as any).set?.({ pages });
    }
  };

  const patchMany = (patcher: (it: any) => any) => {
    const pages = [...st.pages];
    const pg = pages[st.currentPageIndex];
    if (!pg) return;
    pg.items = pg.items.map((it: any) =>
      selectedIds.includes(it.id) ? patcher(it) : it
    );
    (st as any).set?.({ pages });
  };

  // Valeurs courantes
  const x = item.x ?? 0;
  const y = item.y ?? 0;
  const w = item.w ?? 1;
  const h = item.h ?? 1;
  const rot = item.rotation ?? 0;
  const opacity = item.opacity ?? 1;
  const lockAspect = !!item.lockAspect;

  // Nudge pas (⇧ pour pas large si on le souhaite depuis l’événement clavier)
  const nudge = (dx = 0, dy = 0) => {
    patchMany((it) => ({ ...it, x: (it.x ?? 0) + dx, y: (it.y ?? 0) + dy }));
  };

  // Alignements simples (fallback si pas d’actions dédiées)
  const align = (mode: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => {
    if (selectedItems.length < 2) return;
    const xs = selectedItems.map((it: any) => it.x);
    const ys = selectedItems.map((it: any) => it.y);
    const ws = selectedItems.map((it: any) => it.w);
    const hs = selectedItems.map((it: any) => it.h);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs.map((x, i) => x + (ws[i] ?? 0)));
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys.map((y, i) => y + (hs[i] ?? 0)));

    patchMany((it) => {
      switch (mode) {
        case 'left':
          return { ...it, x: minX };
        case 'right':
          return { ...it, x: maxX - (it.w ?? 0) };
        case 'hcenter': {
          const cx = (minX + maxX) / 2;
          return { ...it, x: cx - (it.w ?? 0) / 2 };
        }
        case 'top':
          return { ...it, y: minY };
        case 'bottom':
          return { ...it, y: maxY - (it.h ?? 0) };
        case 'vcenter': {
          const cy = (minY + maxY) / 2;
          return { ...it, y: cy - (it.h ?? 0) / 2 };
        }
      }
    });
  };

  // Distribution simple (fallback)
  const distribute = (axis: 'h' | 'v') => {
    if (selectedItems.length < 3) return;
    const arr = [...selectedItems];
    if (axis === 'h') {
      arr.sort((a: any, b: any) => a.x - b.x);
      const first = arr[0];
      const last = arr[arr.length - 1];
      const span = last.x - first.x;
      const step = span / (arr.length - 1);
      patchMany((it) => {
        const idx = arr.findIndex((a) => a.id === it.id);
        if (idx === -1) return it;
        return { ...it, x: Math.round(first.x + step * idx) };
      });
    } else {
      arr.sort((a: any, b: any) => a.y - b.y);
      const first = arr[0];
      const last = arr[arr.length - 1];
      const span = last.y - first.y;
      const step = span / (arr.length - 1);
      patchMany((it) => {
        const idx = arr.findIndex((a) => a.id === it.id);
        if (idx === -1) return it;
        return { ...it, y: Math.round(first.y + step * idx) };
      });
    }
  };

  // Calques (fallback si pas d’actions dédiées)
  const reorder = (fn: (items: any[]) => any[]) => {
    const pages = [...st.pages];
    const pg = pages[st.currentPageIndex];
    if (!pg) return;
    pg.items = fn(pg.items);
    (st as any).set?.({ pages });
  };

  const bringToFront = () => {
    if (typeof (st as any).bringToFront === 'function') {
      (st as any).bringToFront(st.currentPageIndex, selectedIds);
      return;
    }
    reorder((items) => {
      const sel = items.filter((it) => selectedIds.includes(it.id));
      const rest = items.filter((it) => !selectedIds.includes(it.id));
      return [...rest, ...sel];
    });
  };

  const sendToBack = () => {
    if (typeof (st as any).sendToBack === 'function') {
      (st as any).sendToBack(st.currentPageIndex, selectedIds);
      return;
    }
    reorder((items) => {
      const sel = items.filter((it) => selectedIds.includes(it.id));
      const rest = items.filter((it) => !selectedIds.includes(it.id));
      return [...sel, ...rest];
    });
  };

  const bringForward = () => {
    if (typeof (st as any).bringForward === 'function') {
      (st as any).bringForward(st.currentPageIndex, selectedIds);
      return;
    }
    reorder((items) => {
      const arr = [...items];
      for (let i = arr.length - 2; i >= 0; i--) {
        if (selectedIds.includes(arr[i].id) && !selectedIds.includes(arr[i + 1].id)) {
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        }
      }
      return arr;
    });
  };

  const sendBackward = () => {
    if (typeof (st as any).sendBackward === 'function') {
      (st as any).sendBackward(st.currentPageIndex, selectedIds);
      return;
    }
    reorder((items) => {
      const arr = [...items];
      for (let i = 1; i < arr.length; i++) {
        if (selectedIds.includes(arr[i].id) && !selectedIds.includes(arr[i - 1].id)) {
          [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
          i++;
        }
      }
      return arr;
    });
  };

  // Dupliquer / Supprimer (fallbacks)
  const duplicate = () => {
    if (typeof (st as any).duplicateItem === 'function') {
      selectedIds.forEach((id) => (st as any).duplicateItem(st.currentPageIndex, id));
      return;
    }
    const pages = [...st.pages];
    const pg = pages[st.currentPageIndex];
    if (!pg) return;
    const copies = pg.items
      .filter((it: any) => selectedIds.includes(it.id))
      .map((it: any) => ({
        ...JSON.parse(JSON.stringify(it)),
        id: Math.random().toString(36).slice(2),
        x: (it.x ?? 0) + 1,
        y: (it.y ?? 0) + 1,
      }));
    pg.items.push(...copies);
    (st as any).set?.({ pages, selectedIds: copies.map((c) => c.id) });
  };

  const remove = () => {
    if (typeof (st as any).removeItem === 'function') {
      selectedIds.forEach((id) => (st as any).removeItem(st.currentPageIndex, id));
      return;
    }
    const pages = [...st.pages];
    const pg = pages[st.currentPageIndex];
    if (!pg) return;
    pg.items = pg.items.filter((it: any) => !selectedIds.includes(it.id));
    (st as any).set?.({ pages, selectedIds: [] });
  };

  // Contrôles numériques
  const setX = (v: number) => patchItem({ x: v });
  const setY = (v: number) => patchItem({ y: v });

  const setW = (v: number) => {
    if (lockAspect && item.h) {
      const ar = (item.w ?? 1) / (item.h ?? 1);
      patchItem({ w: v, h: Math.max(0.5, Math.round(v / Math.max(0.0001, ar))) });
    } else {
      patchItem({ w: v });
    }
  };

  const setH = (v: number) => {
    if (lockAspect && item.w) {
      const ar = (item.w ?? 1) / (item.h ?? 1);
      patchItem({ h: v, w: Math.max(0.5, Math.round(v * ar)) });
    } else {
      patchItem({ h: v });
    }
  };

  const setRot = (v: number) => patchItem({ rotation: v });
  const setOpacity = (v: number) => patchItem({ opacity: Math.max(0, Math.min(1, v)) });

  const toggleLockAspect = () => patchItem({ lockAspect: !lockAspect });

  // UI
  return (
    <div className="pointer-events-auto absolute -top-14 left-1/2 z-30 -translate-x-1/2">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
        {/* Position */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">X</span>
          <NumInput value={x} step={1} onChange={setX} title="Position X" />
          <span className="text-[11px] text-slate-600">Y</span>
          <NumInput value={y} step={1} onChange={setY} title="Position Y" />

          <div className="flex items-center gap-1">
            <button
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50"
              onClick={() => nudge(-1, 0)}
              title="← Déplacer à gauche (1)"
            >
              ←
            </button>
            <button
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50"
              onClick={() => nudge(1, 0)}
              title="→ Déplacer à droite (1)"
            >
              →
            </button>
            <button
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50"
              onClick={() => nudge(0, -1)}
              title="↑ Déplacer en haut (1)"
            >
              ↑
            </button>
            <button
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50"
              onClick={() => nudge(0, 1)}
              title="↓ Déplacer en bas (1)"
            >
              ↓
            </button>
          </div>
        </div>

        {/* Tailles */}
        <div className="mx-2 h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">L</span>
          <NumInput value={w} min={0.5} step={1} onChange={setW} title="Largeur" />
          <span className="text-[11px] text-slate-600">H</span>
          <NumInput value={h} min={0.5} step={1} onChange={setH} title="Hauteur" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLockAspect();
            }}
            title={lockAspect ? 'Déverrouiller ratio' : 'Verrouiller ratio'}
            className={
              'h-8 rounded-md border border-slate-300 px-3 text-[12px] ' +
              (lockAspect ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50')
            }
          >
            {lockAspect ? 'Ratio verrouillé' : 'Verrouiller ratio'}
          </button>
        </div>

        {/* Rotation */}
        <div className="mx-2 h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">Rotation</span>
          <NumInput value={rot} step={1} onChange={setRot} title="Rotation (°)" />
          <button
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50"
            onClick={() => setRot(0)}
            title="Réinitialiser rotation"
          >
            0°
          </button>
          <button
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50"
            onClick={() => setRot(((rot ?? 0) - 90) % 360)}
            title="-90°"
          >
            -90°
          </button>
          <button
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50"
            onClick={() => setRot(((rot ?? 0) + 90) % 360)}
            title="+90°"
          >
            +90°
          </button>
        </div>

        {/* Opacité */}
        <div className="mx-2 h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-600">Opacité</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            title="Opacité"
          />
          <span className="text-[11px] tabular-nums text-slate-600 w-8 text-right">
            {Math.round((opacity ?? 1) * 100)}%
          </span>
        </div>

        {/* Alignements / Répartition */}
        <div className="mx-2 h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-1">
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={() => align('left')} title="Aligner à gauche">⟸</button>
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={() => align('hcenter')} title="Centrer horizontalement">↔︎</button>
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={() => align('right')} title="Aligner à droite">⟹</button>
          <span className="w-1" />
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={() => align('top')} title="Aligner en haut">⇡</button>
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={() => align('vcenter')} title="Centrer verticalement">↕︎</button>
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={() => align('bottom')} title="Aligner en bas">⇣</button>
          <span className="w-1" />
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={() => distribute('h')} title="Distribuer horizontalement">═╪═</button>
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={() => distribute('v')} title="Distribuer verticalement">║╪║</button>
        </div>

        {/* Calques */}
        <div className="mx-2 h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-1">
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={bringToFront} title="Mettre tout devant">⤒</button>
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={bringForward} title="Monter d’un cran">▲</button>
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={sendBackward} title="Descendre d’un cran">▼</button>
          <button className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm hover:bg-slate-50" onClick={sendToBack} title="Mettre tout derrière">⤓</button>
        </div>

        {/* Dupliquer / Supprimer */}
        <div className="mx-2 h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-1">
          <button
            className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50"
            onClick={duplicate}
            title="Dupliquer"
          >
            Dupliquer
          </button>
          <button
            className="h-8 rounded-md border border-rose-300 bg-rose-50 px-3 text-sm text-rose-700 hover:bg-rose-100"
            onClick={remove}
            title="Supprimer"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}