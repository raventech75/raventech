'use client';

import { create } from 'zustand';

/* ========= Types ========= */
export type AlbumSizeCm = { w: number; h: number };

export type Asset = {
  id: string;
  url: string;
  ar?: number;               // aspect ratio w/h
  previewUrl?: string;       // miniature downscalée (optionnelle)
};

export type Item = {
  id: string;
  kind: 'photo' | 'text';
  assetId?: string;
  text?: string;

  x: number; y: number; w: number; h: number;
  rot?: number;                 // rotation (deg)
  minW?: number; minH?: number; // contraintes

  // Photo framing
  scale?: number;               // zoom interne (1 par défaut)
  offsetXpct?: number;          // déplacement interne X en %
  offsetYpct?: number;          // déplacement interne Y en %
  cropActive?: boolean;         // mode recadrage actif
  lockAspect?: boolean;         // redimensionnement proportionnel

  // Texte
  fontSize?: number;

  // Style & ordre
  z?: number;                             // ordre d'empilement
  opacity?: number;                       // 0..1
  featherPct?: number;                    // 0..40 (%)
  borderRadiusMode?: 'rounded'|'circle'|'squircle';
  borderRadiusPct?: number;               // si 'rounded' (0..50)
  strokeWidth?: number;                   // px
  strokeColor?: string;                   // #hex
  shadow?: 'none'|'soft'|'heavy';
};

export type PageBackground = {
  kind: 'none' | 'solid' | 'linear' | 'radial' | 'image' | 'text';
  solid?: { color: string };
  linear?: { from: string; to: string; angle: number };
  radial?: { inner: string; outer: string; shape: 'ellipse' | 'circle' };
  image?: {
    assetId?: string;
    url?: string;
    fit?: 'cover' | 'contain';
    opacity?: number;
    scale?: number;
    offsetX?: number;
    offsetY?: number;
  };
  vignette?: { enabled: boolean; strength: number };
  texture?: { type: 'none'|'paper'|'linen'|'grid'; opacity: number };
  noise?: { enabled: boolean; amount: number; opacity: number; monochrome: boolean };
  text?: { content: string; color: string; opacity: number; sizePct: number; rotation: number; font: string };
};

export type Page = {
  id: string;
  index: number;
  items: Item[];
  templateKey?: string;
  background: PageBackground;
};

type HistoryEntry = { pages: Page[]; size: AlbumSizeCm };

type UIState = {
  previewOpen: boolean;
  exporting: boolean;
  importingAssets?: { active: boolean; total: number; done: number };
};

type Store = {
  // Données principales
  size: AlbumSizeCm; // format ouvert ( largeur×2 du fermé )
  dpi: number;
  zoom: number;
  panPx: { x: number; y: number };
  pages: Page[];
  currentPageIndex: number;
  assets: Asset[];

  // Affichages / aides
  showGuides: boolean;
  showRulers: boolean;
  showGrid: boolean;              // grille de fond activable
  snapEnabled: boolean;
  snapDistancePx: number;
  marginsCm: { top: number; right: number; bottom: number; left: number };
  autoLayout: boolean;            // mode layout automatique activé/désactivé

  // UI global
  ui: UIState;

  // Historique
  history: HistoryEntry[];
  historyIndex: number;

  // Sélection
  selectedItemId?: string;

  /* ---- Actions ---- */
  // viewport
  setZoom: (z: number) => void;
  fitToWindow: (containerPx: { w: number; h: number }) => void;
  setPan: (p: { x: number; y: number }) => void;
  resetPan: () => void;

  // formats / DPI
  setSize: (s: AlbumSizeCm) => void;
  setDpi: (dpi: number) => void;

  // pages
  setPages: (updater: (p: Page[]) => Page[]) => void;
  setCurrentPage: (i: number) => void;

  // assets
  setAssets: (a: Asset[]) => void;
  addAsset: (a: Asset) => void;
  addAssets: (arr: Asset[]) => void;
  removeAsset: (id: string) => void;

  // items
  updateItem: (pageIndex: number, itemId: string, patch: Partial<Item>) => void;
  replaceItems: (pageIndex: number, items: Item[]) => void;

  // sélection & ordre
  selectItem: (pageIndex: number, itemId?: string) => void;
  updateSelected: (patch: Partial<Item>) => void;
  removeSelected: () => void;
  bringToFront: (pageIndex: number, itemId: string) => void;
  sendToBack: (pageIndex: number, itemId: string) => void;
  bringForward: (pageIndex: number, itemId: string) => void;
  sendBackward: (pageIndex: number, itemId: string) => void;

  // fonds
  setPageBackground: (pageIndex: number, patch: Partial<PageBackground>) => void;
  setBackgroundText: (pageIndex: number, patch: Partial<NonNullable<PageBackground['text']>>) => void;
  setBackgroundImage: (pageIndex: number, patch: Partial<NonNullable<PageBackground['image']>>) => void;

  // prefs
  toggleGuides: () => void;
  toggleRulers: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleAutoLayout: () => void;           // basculer le mode layout automatique
  setSnapDistancePx: (v: number) => void;
  setMargins: (m: { top?: number; right?: number; bottom?: number; left?: number }) => void;

  // export
  exportJpeg: (opts?: { all?: boolean; quality?: number }) => Promise<void>;

  // nav
  nextPage: () => void;
  prevPage: () => void;

  // historique
  undo: () => void;
  redo: () => void;

  // UI : preview modal + progression import
  openPreview: () => void;
  closePreview: () => void;
  beginImportAssets: (total: number) => void;
  updateImportProgress: (done: number) => void;
  endImportAssets: () => void;

  // helpers
  isAssetUsedOnCurrentPage?: (assetId: string) => boolean;

  // placement intelligent
  addPhotoAutoPack: (assetId: string) => void;
  relayoutCurrentPage: () => void; 
};

/* ========= Formats d'album (fermé) -> canvas ouvert ========= */
export type AlbumFormat = {
  label: string;
  closed: { w: number; h: number };
  open: { w: number; h: number };
};

export const ALBUM_FORMATS: AlbumFormat[] = [
  { label: '15×21 cm (fermé)', closed: { w: 15, h: 21 }, open: { w: 30, h: 21 } },
  { label: '18×24 cm (fermé)', closed: { w: 18, h: 24 }, open: { w: 36, h: 24 } },
  { label: '30×20 cm (fermé)', closed: { w: 30, h: 20 }, open: { w: 60, h: 20 } },
  { label: '30×30 cm (fermé)', closed: { w: 30, h: 30 }, open: { w: 60, h: 30 } },
  { label: '40×30 cm (fermé)', closed: { w: 40, h: 30 }, open: { w: 80, h: 30 } },
];

// Compat pour composants existants
export const ALBUM_SIZES: { label: string; w: number; h: number }[] = ALBUM_FORMATS.map(f => ({
  label: `${f.label} • ouvert ${f.open.w}×${f.open.h} cm`,
  w: f.open.w, h: f.open.h,
}));

// Par défaut : 30×30 fermé → 60×30 ouvert
export const DEFAULT_SIZE = ALBUM_FORMATS.find(f => f.closed.w === 30 && f.closed.h === 30)!.open;

/* ========= Helpers ========= */
const CM_TO_PX = (cm: number) => (cm / 2.54) * 96;
function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

function pushHistory(get: () => Store, set: (p: Partial<Store>) => void) {
  const s = get();
  const entry: HistoryEntry = { pages: deepClone(s.pages), size: { ...s.size } };
  const newHistory = s.history.slice(0, s.historyIndex + 1).concat(entry);
  set({ history: newHistory, historyIndex: newHistory.length - 1 });
}

const DEFAULT_BACKGROUND: PageBackground = {
  kind: 'none',
  solid: { color: '#FFFFFF' },
  linear: { from: '#FFFFFF', to: '#F8FAFC', angle: 90 },
  radial: { inner: '#FFFFFF', outer: '#F1F5F9', shape: 'ellipse' },
  image: { fit: 'cover', opacity: 1, scale: 1, offsetX: 0, offsetY: 0 },
  vignette: { enabled: false, strength: 0.25 },
  texture: { type: 'none', opacity: 0.3 },
  noise: { enabled: false, amount: 0.15, opacity: 0.15, monochrome: true },
  text: { content: '', color: '#000000', opacity: 0.08, sizePct: 40, rotation: -20, font: 'serif' },
};

/* ======== Justified full-cover layout (helper) ======== */
function relayoutPhotosFullCover(
  page: Page,
  size: AlbumSizeCm,
  margins: { top: number; right: number; bottom: number; left: number },
  assets: Asset[],
): Item[] {
  const left = margins.left;
  const right = margins.right;
  const top = margins.top;
  const bottom = margins.bottom;

  const availW = Math.max(1, size.w - left - right);
  const availH = Math.max(1, size.h - top - bottom);

  // Sélectionner uniquement les items photo, conserver l'ordre d'origine.
  const photos = page.items.filter(i => i.kind === 'photo');
  const others = page.items.filter(i => i.kind !== 'photo');

  if (photos.length === 0) return page.items;

  // Récupère le ratio de chaque photo
  const ars = photos.map(it => {
    const a = it.assetId ? assets.find(x => x.id === it.assetId) : undefined;
    if (a?.ar && a.ar > 0) return a.ar;
    if (it.w > 0 && it.h > 0) return it.w / it.h;
    return 1;
  });

  // Construire les lignes selon une hauteur cible nominale (H0)
  const N = photos.length;
  const avgAr = ars.reduce((s, r) => s + r, 0) / N;
  const approxRows = Math.max(1, Math.round(Math.sqrt(N * (avgAr * availH / Math.max(1, availW)))));
  const H0 = Math.max(2, availH / approxRows);

  type Row = { idxs: number[]; sumAr: number };
  const rows: Row[] = [];
  let cur: Row = { idxs: [], sumAr: 0 };

  for (let i = 0; i < N; i++) {
    cur.idxs.push(i);
    cur.sumAr += ars[i];
    if (cur.sumAr * H0 >= availW && cur.idxs.length > 0) {
      rows.push(cur);
      cur = { idxs: [], sumAr: 0 };
    }
  }
  if (cur.idxs.length) rows.push(cur);

  // Hauteur réelle de chaque ligne pour occuper exactement la largeur
  const rowHeightsAtScale1 = rows.map(r => availW / Math.max(0.0001, r.sumAr));
  const totalH1 = rowHeightsAtScale1.reduce((s, h) => s + h, 0);
  const scaleY = availH / Math.max(0.0001, totalH1);
  const rowHeights = rowHeightsAtScale1.map(h => h * scaleY);

  // Générer les nouveaux items photos
  const outPhotos: Item[] = [];
  let y = top;
  for (let ri = 0; ri < rows.length; ri++) {
    const r = rows[ri];
    const h = rowHeights[ri];
    let x = left;
    for (const idx of r.idxs) {
      const it = photos[idx];
      const ar = ars[idx];
      const w = h * ar;
      outPhotos.push({
        ...it,
        x: round2(x), y: round2(y), w: round2(w), h: round2(h),
      });
      x += w;
    }
    y += h;
  }

  // Conserver le z des éléments
  outPhotos.sort((a,b)=>(a.z ?? 0) - (b.z ?? 0));

  const result = [...outPhotos, ...others];
  return result;
}

function round2(v: number) { return Math.round(v * 100) / 100; }

/* ========= Store ========= */
export const useAlbumStore = create<Store>((set, get) => ({
  size: { w: DEFAULT_SIZE.w, h: DEFAULT_SIZE.h },
  dpi: 300,
  zoom: 1,
  panPx: { x: 0, y: 0 },
  pages: [{ id: 'p0', index: 0, items: [], background: deepClone(DEFAULT_BACKGROUND) }],
  currentPageIndex: 0,
  assets: [],

  // affichage / aides
  showGuides: true,
  showRulers: false,
  showGrid: false,
  snapEnabled: true,
  snapDistancePx: 10,
  marginsCm: { top: 1, right: 1, bottom: 1, left: 1 },
  autoLayout: true,               // par défaut, le layout automatique est activé

  // UI
  ui: { previewOpen: false, exporting: false, importingAssets: { active: false, total: 0, done: 0 } },

  // historique
  history: [],
  historyIndex: -1,

  // sélection
  selectedItemId: undefined,

  /* ===== viewport ===== */
  setZoom: (z) => set({ zoom: Math.max(0.05, Math.min(6, z)) }),
  setPan: (p) => set({ panPx: p }),
  resetPan: () => set({ panPx: { x: 0, y: 0 } }),

  fitToWindow: ({ w, h }) => {
    const s = get().size;
    const pagePxW = CM_TO_PX(s.w);
    const pagePxH = CM_TO_PX(s.h);
    const pad = 24;
    const zoomW = (w - pad) / pagePxW;
    const zoomH = (h - pad) / pagePxH;
    const z = Math.max(0.05, Math.min(zoomW, zoomH));
    set({ zoom: z, panPx: { x: 0, y: 0 } });
  },

  /* ===== formats / dpi ===== */
  setSize: (newSize) => {
    const s = get();
    const old = s.size;
    const scaleX = newSize.w / old.w;
    const scaleY = newSize.h / old.h;
    const fontScale = Math.min(scaleX, scaleY);

    pushHistory(get, set);

    set({
      size: newSize,
      panPx: { x: 0, y: 0 },
      pages: s.pages.map((p) => ({
        ...p,
        items: p.items.map((it) => ({
          ...it,
          x: it.x * scaleX,
          y: it.y * scaleY,
          w: it.w * scaleX,
          h: it.h * scaleY,
          fontSize: it.fontSize ? it.fontSize * fontScale : it.fontSize,
        })),
        background: { ...p.background },
      })),
    });

    // Signaux UI (fit auto)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('album:size-changed'));
      window.dispatchEvent(new CustomEvent('album:zoom-fit'));
    }, 0);
  },

  setDpi: (dpi) => set({ dpi }),

  /* ===== pages ===== */
  setPages: (updater) => {
    pushHistory(get, set);
    const next = updater(get().pages);
    set({ pages: next });
  },

  setCurrentPage: (i) =>
    set({ currentPageIndex: Math.max(0, Math.min(i, get().pages.length - 1)) }),

  /* ===== assets ===== */
  setAssets: (a) => set({ assets: a }),
  addAsset: (a) => set((s) => ({ assets: [...s.assets, a] })),
  addAssets: (arr) => set((s) => ({ assets: [...s.assets, ...arr] })),
  removeAsset: (id) => set((s) => ({ assets: s.assets.filter((x) => x.id !== id) })),

  /* ===== items ===== */
  updateItem: (pageIndex, itemId, patch) => {
    pushHistory(get, set);
    const pages = get().pages.map((p, i) => {
      if (i !== pageIndex) return p;
      return {
        ...p,
        items: p.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
      };
    });
    set({ pages });
  },

  replaceItems: (pageIndex, items) => {
    pushHistory(get, set);
    const pages = get().pages.map((p, i) => (i === pageIndex ? { ...p, items } : p));
    set({ pages });
  },

  /* ===== sélection & ordre ===== */
  selectItem: (_pi, itemId) => set({ selectedItemId: itemId }),

  updateSelected: (patch) => {
    const s = get();
    const id = s.selectedItemId;
    if (!id) return;
    pushHistory(get, set);
    const pages = s.pages.map((p, i) => {
      if (i !== s.currentPageIndex) return p;
      return { ...p, items: p.items.map(it => it.id === id ? { ...it, ...patch } : it) };
    });
    set({ pages });
  },

  removeSelected: () => {
    const s = get();
    const id = s.selectedItemId;
    if (!id) return;
    pushHistory(get, set);

    // supprimer
    let pages = s.pages.map((p, i) => {
      if (i !== s.currentPageIndex) return p;
      return { ...p, items: p.items.filter(it => it.id !== id) };
    });

    // réorganisation automatique des photos restantes SEULEMENT si le mode auto est activé
    if (s.autoLayout) {
      const pg = pages[s.currentPageIndex];
      if (pg) {
        const relayout = relayoutPhotosFullCover(pg, s.size, s.marginsCm, s.assets);
        pages = pages.map((p, i) => (i === s.currentPageIndex ? { ...p, items: relayout } : p));
      }
    }

    set({ pages, selectedItemId: undefined });
  },

  bringToFront: (pi, id) => {
    const s = get();
    const pages = s.pages.map((p, i) => {
      if (i !== pi) return p;
      const maxZ = Math.max(0, ...p.items.map(it => it.z ?? 0));
      return { ...p, items: p.items.map(it => it.id === id ? { ...it, z: maxZ + 1 } : it) };
    });
    set({ pages });
  },

  sendToBack: (pi, id) => {
    const s = get();
    const pages = s.pages.map((p, i) => {
      if (i !== pi) return p;
      const minZ = Math.min(0, ...p.items.map(it => it.z ?? 0));
      return { ...p, items: p.items.map(it => it.id === id ? { ...it, z: minZ - 1 } : it) };
    });
    set({ pages });
  },

  bringForward: (pi, id) => {
    const s = get();
    const pages = s.pages.map((p, i) => {
      if (i !== pi) return p;
      return { ...p, items: p.items.map(it => it.id === id ? { ...it, z: (it.z ?? 0) + 1 } : it) };
    });
    set({ pages });
  },

  sendBackward: (pi, id) => {
    const s = get();
    const pages = s.pages.map((p, i) => {
      if (i !== pi) return p;
      return { ...p, items: p.items.map(it => it.id === id ? { ...it, z: (it.z ?? 0) - 1 } : it) };
    });
    set({ pages });
  },

  /* ===== backgrounds ===== */
  setPageBackground: (pageIndex, patch) => {
    pushHistory(get, set);
    set({
      pages: get().pages.map((p, i) =>
        i === pageIndex ? { ...p, background: { ...p.background, ...patch } } : p
      ),
    });
  },

  setBackgroundText: (pageIndex, patch) => {
    pushHistory(get, set);
    set({
      pages: get().pages.map((p, i) =>
        i === pageIndex
          ? { ...p, background: { ...p.background, text: { ...p.background.text!, ...patch } } }
          : p
      ),
    });
  },

  setBackgroundImage: (pageIndex, patch) => {
    pushHistory(get, set);
    set({
      pages: get().pages.map((p, i) =>
        i === pageIndex
          ? { ...p, background: { ...p.background, image: { ...(p.background.image ?? {}), ...patch } } }
          : p
      ),
    });
  },

  /* ===== prefs ===== */
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleGrid:   () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  toggleAutoLayout: () => set((s) => ({ autoLayout: !s.autoLayout })),
  setSnapDistancePx: (v) => set({ snapDistancePx: Math.max(1, Math.min(40, v)) }),
  setMargins: (m) => set((s) => ({ marginsCm: { ...s.marginsCm, ...m } })),

  /* ===== export ===== */
  exportJpeg: async ({ all = false, quality = 0.92 } = {}) => {
    const s = get();
    if (s.ui.exporting) return;
    set({ ui: { ...s.ui, exporting: true } });
    try {
      const pages = all ? s.pages : [s.pages[s.currentPageIndex]];
      const pxW = Math.round((s.size.w / 2.54) * s.dpi);
      const pxH = Math.round((s.size.h / 2.54) * s.dpi);

      for (const page of pages) {
        const canvas = document.createElement('canvas');
        canvas.width = pxW; canvas.height = pxH;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pxW, pxH);

        await renderBackgroundToCanvas(ctx, page.background, pxW, pxH, s.assets);

        // items (photos + textes)
        for (const it of [...page.items].sort((a,b)=>(a.z??0)-(b.z??0))) {
          const x = Math.round((it.x / 2.54) * s.dpi);
          const y = Math.round((it.y / 2.54) * s.dpi);
          const w = Math.round((it.w / 2.54) * s.dpi);
          const h = Math.round((it.h / 2.54) * s.dpi);

          ctx.save();
          if (it.rot) {
            ctx.translate(x + w / 2, y + h / 2);
            ctx.rotate((it.rot * Math.PI) / 180);
            ctx.translate(-(x + w / 2), -(y + h / 2));
          }
          ctx.globalAlpha = it.opacity ?? 1;

          if (it.kind === 'photo' && it.assetId) {
            const asset = s.assets.find((a) => a.id === it.assetId);
            if (asset) {
              const img = await loadImage(asset.url);
              drawCoverContain(
                ctx, img, x, y, w, h,
                'cover',
                it.scale ?? 1,
                { x: it.offsetXpct ?? 0, y: it.offsetYpct ?? 0 },
                it.opacity ?? 1
              );
            }
          } else if (it.kind === 'text' && it.text) {
            ctx.fillStyle = '#111827';
            const fs = Math.round((it.fontSize ?? 14) * (s.dpi / 96));
            const lh = Math.round(1.3 * fs);
            ctx.font = `${fs}px sans-serif`;
            ctx.textBaseline = 'top';
            wrapAndFillText(ctx, it.text, x, y, w, lh);
          }
          ctx.restore();
        }

        const data = canvas.toDataURL('image/jpeg', quality);
        const link = document.createElement('a');
        link.href = data;
        link.download = `album_p${(page.index + 1).toString().padStart(2, '0')}_300dpi.jpg`;
        link.click();
      }
    } finally {
      set({ ui: { ...get().ui, exporting: false } });
    }
  },

  /* ===== navigation ===== */
  nextPage: () => set((s) => ({ currentPageIndex: Math.min(s.currentPageIndex + 1, s.pages.length - 1) })),
  prevPage: () => set((s) => ({ currentPageIndex: Math.max(s.currentPageIndex - 1, 0) })),

  /* ===== historique ===== */
  undo: () => {
    const s = get();
    if (s.historyIndex <= 0) return;
    const prev = s.history[s.historyIndex - 1];
    set({
      pages: deepClone(prev.pages),
      size: { ...prev.size },
      panPx: { x: 0, y: 0 },
      historyIndex: s.historyIndex - 1,
    });
    setTimeout(() => window.dispatchEvent(new CustomEvent('album:zoom-fit')), 0);
  },

  redo: () => {
    const s = get();
    if (s.historyIndex >= s.history.length - 1) return;
    const nxt = s.history[s.historyIndex + 1];
    set({
      pages: deepClone(nxt.pages),
      size: { ...nxt.size },
      panPx: { x: 0, y: 0 },
      historyIndex: s.historyIndex + 1,
    });
    setTimeout(() => window.dispatchEvent(new CustomEvent('album:zoom-fit')), 0);
  },

  /* ===== preview & import progress ===== */
  openPreview: () => set((s) => ({ ui: { ...s.ui, previewOpen: true } })),
  closePreview: () => set((s) => ({ ui: { ...s.ui, previewOpen: false } })),

  beginImportAssets: (total) =>
    set((s) => ({ ui: { ...s.ui, importingAssets: { active: true, total, done: 0 } } })),
  updateImportProgress: (done) =>
    set((s) => ({
      ui: {
        ...s.ui,
        importingAssets: { active: true, total: s.ui.importingAssets?.total ?? done, done },
      },
    })),
  endImportAssets: () =>
    set((s) => ({ ui: { ...s.ui, importingAssets: { active: false, total: 0, done: 0 } } })),

  isAssetUsedOnCurrentPage: (assetId: string) => {
    const s = get();
    const pg = s.pages[s.currentPageIndex];
    return pg?.items?.some((it) => it.kind === 'photo' && it.assetId === assetId) ?? false;
  },

  /* ===== Réagence toutes les photos de la page courante pour couvrir 100% de la zone utile ===== */
  relayoutCurrentPage: () => {
    const s = get();
    const pg = s.pages[s.currentPageIndex];
    if (!pg) return;

    const nextItems = relayoutPhotosFullCover(pg, s.size, s.marginsCm, s.assets);
    const pages = s.pages.map((p, i) => (i === s.currentPageIndex ? { ...p, items: nextItems } : p));
    set({ pages });
  },

  /* ===== Placement intelligent (plein cadre – justified) ===== */
  addPhotoAutoPack: (assetId: string) => {
    const st = get();
    const pgIndex = st.currentPageIndex;
    const pages = [...st.pages];
    const pg = pages[pgIndex]; 
    if (!pg) return;

    // on insère l'item puis on relayout toutes les photos
    const id = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : 'it_' + Math.random().toString(36).slice(2);
    const maxZ = Math.max(0, ...pg.items.map(i => i.z ?? 0));
    const newItem: Item = {
      id, kind: 'photo', assetId,
      x: 0, y: 0, w: 4, h: 4,
      z: maxZ + 1, scale: 1, rot: 0, opacity: 1,
      borderRadiusMode: 'rounded', borderRadiusPct: 0,
      strokeWidth: 0, strokeColor: '#000000', shadow: 'none',
      featherPct: 0,
    };

    pushHistory(get, set);

    const withNew = { ...pg, items: [...pg.items, newItem] };
    const relayout = relayoutPhotosFullCover(withNew, st.size, st.marginsCm, st.assets);

    pages[pgIndex] = { ...withNew, items: relayout };
    set({ pages, selectedItemId: id });
  },
}));

/* ========= Utils (canvas export) ========= */

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

function drawCoverContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
  fit: 'cover' | 'contain',
  scaleExtra: number = 1,
  offsetPct: { x: number; y: number } = { x: 0, y: 0 },
  opacity: number = 1
) {
  const iw = img.width, ih = img.height;
  const ir = iw / ih; const tr = w / h;
  let dw = w, dh = h, dx = x, dy = y;

  if (fit === 'cover') {
    if (ir > tr) { dh = h; dw = h * ir; dx = x - (dw - w) / 2; }
    else { dw = w; dh = w / ir; dy = y - (dh - h) / 2; }
  } else {
    if (ir > tr) { dw = w; dh = w / ir; dy = y + (h - dh) / 2; }
    else { dh = h; dw = h * ir; dx = x + (w - dw) / 2; }
  }

  const cx = x + w / 2, cy = y + h / 2;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(cx, cy);
  ctx.scale(scaleExtra, scaleExtra);
  ctx.translate(-cx, -cy);

  dx += (offsetPct.x / 100) * (w / 2);
  dy += (offsetPct.y / 100) * (h / 2);

  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function wrapAndFillText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(/\s+/);
  let line = '', ty = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, ty); ty += lineH; line = w;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, x, ty);
}

/* ---- Export: rendu du background ---- */
async function renderBackgroundToCanvas(
  ctx: CanvasRenderingContext2D,
  bg: PageBackground,
  pxW: number, pxH: number,
  assets: Asset[]
) {
  if (bg.kind === 'solid' && bg.solid) {
    ctx.fillStyle = bg.solid.color;
    ctx.fillRect(0, 0, pxW, pxH);
  }

  if (bg.kind === 'linear' && bg.linear) {
    const angle = ((bg.linear.angle % 360) + 360) % 360;
    const rad = (angle * Math.PI) / 180;
    const half = Math.max(pxW, pxH);
    const cx = pxW / 2, cy = pxH / 2;
    const x0 = cx - Math.cos(rad) * half, y0 = cy - Math.sin(rad) * half;
    const x1 = cx + Math.cos(rad) * half, y1 = cy + Math.sin(rad) * half;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, bg.linear.from); g.addColorStop(1, bg.linear.to);
    ctx.fillStyle = g; ctx.fillRect(0, 0, pxW, pxH);
  }

  if (bg.kind === 'radial' && bg.radial) {
    const r = Math.hypot(pxW, pxH) / 2;
    const g = ctx.createRadialGradient(pxW / 2, pxH / 2, 0, pxW / 2, pxH / 2, r);
    g.addColorStop(0, bg.radial.inner); g.addColorStop(1, bg.radial.outer);
    ctx.fillStyle = g; ctx.fillRect(0, 0, pxW, pxH);
  }

  if (bg.kind === 'image' && bg.image && (bg.image.assetId || bg.image.url)) {
    const asset = bg.image.assetId ? assets.find(a => a.id === bg.image!.assetId) : undefined;
    const url = asset?.url || bg.image.url!;
    try {
      const img = await loadImage(url);
      drawCoverContain(
        ctx, img, 0, 0, pxW, pxH,
        bg.image.fit ?? 'cover', 
        bg.image.scale ?? 1,
        { x: bg.image.offsetX ?? 0, y: bg.image.offsetY ?? 0 },
        bg.image.opacity ?? 1
      );
    } catch {}
  }

  if (bg.texture && bg.texture.type !== 'none' && bg.texture.opacity > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, bg.texture.opacity));
    drawTexture(ctx, pxW, pxH, bg.texture.type);
    ctx.restore();
  }

  if (bg.kind === 'text' && bg.text && bg.text.content.trim()) {
    const { content, color, opacity, sizePct, rotation, font } = bg.text;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.fillStyle = color;
    const fs = Math.max(12, Math.round((sizePct / 100) * pxW));
    ctx.font = `${fs}px ${font || 'serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(pxW / 2, pxH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.fillText(content, 0, 0);
    ctx.restore();
  }

  if (bg.vignette?.enabled) {
    const strength = Math.max(0, Math.min(1, bg.vignette.strength));
    const grd = ctx.createRadialGradient(pxW / 2, pxH / 2, Math.min(pxW, pxH) * 0.2, pxW / 2, pxH / 2, Math.max(pxW, pxH) * 0.7);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, `rgba(0,0,0,${0.7 * strength})`);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, pxW, pxH);
  }

  if (bg.noise?.enabled && bg.noise.opacity > 0 && bg.noise.amount > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, bg.noise.opacity));
    drawNoise(ctx, pxW, pxH, Math.max(0, Math.min(1, bg.noise.amount)), !!bg.noise.monochrome);
    ctx.restore();
  }
}

/* Simple textures */
function drawTexture(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'paper'|'linen'|'grid') {
  if (type === 'grid') {
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1;
    const step = 24;
    for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
    for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
    return;
  }
  const count = type === 'paper' ? 350 : 600;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const len = (type === 'paper' ? 10 : 18) * Math.random();
    const ang = Math.random() * Math.PI * 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = type === 'paper' ? 0.6 : 0.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
}

/* Procedural noise */
function drawNoise(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, mono: boolean) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const amp = Math.round(255 * amount);
  for (let i = 0; i < d.length; i += 4) {
    if (mono) {
      const n = Math.floor(Math.random() * amp);
      d[i] = n; d[i+1] = n; d[i+2] = n; d[i+3] = 255;
    } else {
      d[i] = Math.floor(Math.random() * amp);
      d[i+1] = Math.floor(Math.random() * amp);
      d[i+2] = Math.floor(Math.random() * amp);
      d[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}