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
  z?: number;                             // ordre d’empilement
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
    fit: 'cover' | 'contain';
    opacity: number;
    scale: number;
    offsetX: number;
    offsetY: number;
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

  // (optionnel) exposer push history si besoin
  // pushHistory?: () => void;

  // compat sélection (pour anciens composants)
  setSelected?: (ids: string[]) => void;
  setSelectedIds?: (ids: string[]) => void;
  setSelectedId?: (id: string) => void;

  // ajout direct d'une photo sur la page courante
  addPhotoOnPage?: (args: { assetId: string; x: number; y: number; w: number; h: number }) => void;
};

/* ========= Formats d’album (fermé) -> canvas ouvert ========= */
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
/** Recalcule les positions/taille des photos pour remplir 100% de la zone utile (entre marges),
 * en respectant leur ratio. Basé sur un algorithme “justified gallery” :
 * - Chaque ligne est redimensionnée pour occuper toute la largeur disponible.
 * - Puis toutes les lignes sont **uniformément** mises à l’échelle verticalement pour remplir toute la hauteur disponible. */
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

  // Sélectionner uniquement les items photo, conserver l’ordre d’origine.
  const photos = page.items.filter(i => i.kind === 'photo');
  const others = page.items.filter(i => i.kind !== 'photo'); // on les laisse inchangés

  if (photos.length === 0) return page.items;

  // Récupère le ratio de chaque photo (asset.ar sinon ratio actuel sinon 1).
  const ars = photos.map(it => {
    const a = it.assetId ? assets.find(x => x.id === it.assetId) : undefined;
    if (a?.ar && a.ar > 0) return a.ar;
    if (it.w > 0 && it.h > 0) return it.w / it.h;
    return 1;
  });

  // Construire les lignes selon une hauteur cible nominale (H0), puis on corrigera.
  const N = photos.length;
  const avgAr = ars.reduce((s, r) => s + r, 0) / N;
  const approxRows = Math.max(1, Math.round(Math.sqrt(N * (avgAr * availH / Math.max(1, availW))))); // estimation douce
  const H0 = Math.max(2, availH / approxRows); // hauteur nominale de ligne (cm)

  type Row = { idxs: number[]; sumAr: number };
  const rows: Row[] = [];
  let cur: Row = { idxs: [], sumAr: 0 };

  for (let i = 0; i < N; i++) {
    cur.idxs.push(i);
    cur.sumAr += ars[i];
    // si à hauteur H0 cette ligne dépasserait la largeur, on la ferme
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

  // Conserver le z des éléments (on garde l’ordre relatif initial)
  outPhotos.sort((a,b)=>(a.z ?? 0) - (b.z ?? 0));

  // Recomposer la liste : photos réagencées + autres inchangés
  // (si tu veux forcer les “autres” au-dessus/dessous, réordonne ici selon z)
  const result = [...outPhotos, ...others];
  // Réindex “minW/minH” si présents (non obligatoire)
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
  // compat: ajout direct d'une photo à la page courante
  addPhotoOnPage: ({ assetId, x, y, w, h }) => {
    pushHistory(get, set);
    const s = get();
    const pages = s.pages.map((p, i) => {
      if (i !== s.currentPageIndex) return p;
      const id = Math.random().toString(36).slice(2);
      const photo: Item = {
        id,
        kind: 'photo',
        x, y, w, h,
        rotation: 0,
        opacity: 1,
        assetId,
        lockAspect: true,
      } as any;
      return { ...p, items: [...p.items, photo] };
    });
    set({ pages, selectedItemId: undefined });
    // on sélectionne le dernier ajouté
    const newPg = pages[s.currentPageIndex];
    const lastId = newPg?.items[newPg.items.length - 1]?.id;
    if (lastId) set({ selectedItemId: lastId });
  },

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
  // compat: anciennes APIs
  setSelected: (ids) => set({ selectedItemId: ids && ids.length ? ids[0] : undefined }),
  setSelectedIds: (ids) => set({ selectedItemId: ids && ids.length ? ids[0] : undefined }),
  setSelectedId: (id) => set({ selectedItemId: id }),


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

    // réorganisation automatique des photos restantes pour garder la couverture 100%
    const pg = pages[s.currentPageIndex];
    if (pg) {
      const relayout = relayoutPhotosFullCover(pg, s.size, s.marginsCm, s.assets);
      pages = pages.map((p, i) => (i === s.currentPageIndex ? { ...p, items: relayout } : p));
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
          ? { ...p, background: { ...p.background, image: (() => { const img = { ...(p.background.image as any || {}), ...(patch as any) }; const fit = (img.fit ?? 'cover') as 'cover' | 'contain'; return { ...img, fit }; })() } }
          : p
      ),
    });
  },

  /* ===== prefs ===== */
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleGrid:   () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  setSnapDistancePx: (v) => set({ snapDistancePx: Math.max(1, Math.min(40, v)) }),
  setMargins: (m) => set((s) => ({ marginsCm: { ...s.marginsCm, ...m } })),

  /* ===== export ===== */
exportJpeg: async ({ 
  all = false, 
  quality = 0.92, 
  pages: specificPages 
}: { 
  all?: boolean; 
  quality?: number; 
  pages?: number[]; 
} = {}) => {
  const s = get();
  if (s.ui.exporting) return;
  
  set({ ui: { ...s.ui, exporting: true } });
  
  try {
    // Déterminer quelles pages exporter
    let pagesToExport: Page[];
    if (specificPages && Array.isArray(specificPages)) {
      // Export de pages spécifiques (par index)
      pagesToExport = specificPages.map(index => s.pages[index]).filter(Boolean);
    } else if (all) {
      // Export de toutes les pages
      pagesToExport = s.pages;
    } else {
      // Export de la page courante uniquement
      pagesToExport = [s.pages[s.currentPageIndex]];
    }

    const pxW = Math.round((s.size.w / 2.54) * s.dpi);
    const pxH = Math.round((s.size.h / 2.54) * s.dpi);

    for (let i = 0; i < pagesToExport.length; i++) {
      const page = pagesToExport[i];
      if (!page) continue;

      // Créer le canvas d'export
      const canvas = document.createElement('canvas');
      canvas.width = pxW;
      canvas.height = pxH;
      const ctx = canvas.getContext('2d')!;

      // ✅ ÉTAPE CRITIQUE : Rendu du fond de page
      await renderBackgroundToCanvas(ctx, page.background, pxW, pxH, s.assets);

      // Rendu des éléments (photos + textes)
      const sortedItems = [...page.items].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
      
      for (const item of sortedItems) {
        const x = Math.round((item.x / 2.54) * s.dpi);
        const y = Math.round((item.y / 2.54) * s.dpi);
        const w = Math.round((item.w / 2.54) * s.dpi);
        const h = Math.round((item.h / 2.54) * s.dpi);

        ctx.save();
        
        // Rotation
        if (item.rot) {
          ctx.translate(x + w / 2, y + h / 2);
          ctx.rotate((item.rot * Math.PI) / 180);
          ctx.translate(-(x + w / 2), -(y + h / 2));
        }
        
        // Opacité
        ctx.globalAlpha = item.opacity ?? 1;

        if (item.kind === 'photo' && item.assetId) {
          const asset = s.assets.find((a) => a.id === item.assetId);
          if (asset) {
            try {
              const img = await loadImage(asset.url);
              drawCoverContain(
                ctx, img, x, y, w, h,
                'contain', // ✅ Utiliser 'contain' pour préserver l'homothétie
                (item as any).scale ?? 1,
                { 
                  x: (item as any).offsetXpct ?? 0, 
                  y: (item as any).offsetYpct ?? 0 
                },
                item.opacity ?? 1
              );
            } catch (error) {
              console.warn('Erreur chargement image:', error);
              // Dessiner un placeholder en cas d'erreur
              ctx.fillStyle = '#f3f4f6';
              ctx.fillRect(x, y, w, h);
              ctx.fillStyle = '#6b7280';
              ctx.font = `${Math.min(w, h) / 8}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('Image manquante', x + w / 2, y + h / 2);
            }
          }
        } else if (item.kind === 'text' && item.text) {
          ctx.fillStyle = '#111827';
          const fontSize = Math.round((item.fontSize ?? 14) * (s.dpi / 96));
          const lineHeight = Math.round(1.3 * fontSize);
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textBaseline = 'top';
          wrapAndFillText(ctx, item.text, x + 8, y + 8, w - 16, lineHeight);
        }
        
        ctx.restore();
      }

      // Télécharger l'image
      const dataURL = canvas.toDataURL('image/jpeg', quality);
      const link = document.createElement('a');
      const pageNumber = all || specificPages ? page.index + 1 : s.currentPageIndex + 1;
      link.href = dataURL;
      link.download = `album_page_${pageNumber.toString().padStart(2, '0')}_${s.dpi}dpi.jpg`;
      link.click();
      
      // Petite pause entre les exports pour éviter de bloquer le navigateur
      if (i < pagesToExport.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    alert('Erreur lors de l\'export. Vérifiez la console pour plus de détails.');
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

  /* ===== Placement intelligent (plein cadre – justified) ===== */
  relayoutCurrentPage: () => {
    const s = get();
    const pg = s.pages[s.currentPageIndex];
    if (!pg) return;

    const nextItems = relayoutPhotosFullCover(pg, s.size, s.marginsCm, s.assets);
    const pages = s.pages.map((p, i) => (i === s.currentPageIndex ? { ...p, items: nextItems } : p));
    set({ pages });
  },

  addPhotoAutoPack: (assetId: string) => {
    const st = get();
    const pgIndex = st.currentPageIndex;
    const pages = [...st.pages];
    const pg = pages[pgIndex]; if (!pg) return;

    // on insère l’item puis on relayout toutes les photos
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
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(new Error(`Impossible de charger l'image: ${url}`));
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
  const imgWidth = img.width;
  const imgHeight = img.height;
  const imgRatio = imgWidth / imgHeight;
  const targetRatio = w / h;
  
  let drawW = w;
  let drawH = h;
  let drawX = x;
  let drawY = y;

  if (fit === 'cover') {
    if (imgRatio > targetRatio) {
      drawH = h;
      drawW = h * imgRatio;
      drawX = x - (drawW - w) / 2;
    } else {
      drawW = w;
      drawH = w / imgRatio;
      drawY = y - (drawH - h) / 2;
    }
  } else { // contain
    if (imgRatio > targetRatio) {
      drawW = w;
      drawH = w / imgRatio;
      drawY = y + (h - drawH) / 2;
    } else {
      drawH = h;
      drawW = h * imgRatio;
      drawX = x + (w - drawW) / 2;
    }
  }

  // Appliquer l'échelle supplémentaire
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Transformer depuis le centre
  ctx.translate(centerX, centerY);
  ctx.scale(scaleExtra, scaleExtra);
  ctx.translate(-centerX, -centerY);

  // Appliquer les offsets (en pourcentage de la taille du conteneur)
  drawX += (offsetPct.x / 100) * (w / 2);
  drawY += (offsetPct.y / 100) * (h / 2);

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
}

function wrapAndFillText(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  x: number, 
  y: number, 
  maxWidth: number, 
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;

  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  }
  
  if (line) {
    ctx.fillText(line, x, currentY);
  }
}

/* ---- Export: rendu du background ---- */
async function renderBackgroundToCanvas(
  ctx: CanvasRenderingContext2D,
  bg: PageBackground,
  pxW: number, 
  pxH: number,
  assets: Asset[]
) {
  switch (bg.kind) {
    case 'solid':
      if (bg.solid?.color) {
        ctx.fillStyle = bg.solid.color;
        ctx.fillRect(0, 0, pxW, pxH);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, pxW, pxH);
      }
      break;

    case 'linear':
      if (bg.linear) {
        const angle = ((bg.linear.angle || 90) % 360 + 360) % 360;
        const rad = (angle * Math.PI) / 180;
        const half = Math.max(pxW, pxH);
        const cx = pxW / 2, cy = pxH / 2;
        const x0 = cx - Math.cos(rad) * half;
        const y0 = cy - Math.sin(rad) * half;
        const x1 = cx + Math.cos(rad) * half;
        const y1 = cy + Math.sin(rad) * half;
        
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        gradient.addColorStop(0, bg.linear.from || '#FFFFFF');
        gradient.addColorStop(1, bg.linear.to || '#F8FAFC');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, pxW, pxH);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, pxW, pxH);
      }
      break;

    case 'radial':
      if (bg.radial) {
        const radius = Math.hypot(pxW, pxH) / 2;
        const gradient = ctx.createRadialGradient(
          pxW / 2, pxH / 2, 0,
          pxW / 2, pxH / 2, radius
        );
        gradient.addColorStop(0, bg.radial.inner || '#FFFFFF');
        gradient.addColorStop(1, bg.radial.outer || '#F1F5F9');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, pxW, pxH);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, pxW, pxH);
      }
      break;

    default:
      // Pour 'none', 'image', 'text' - fond blanc par défaut
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, pxW, pxH);
      break;
  }

// 2. Image d'arrière-plan
  if (bg.kind === 'image' && bg.image && (bg.image.assetId || bg.image.url)) {
    const asset = bg.image.assetId ? assets.find(a => a.id === bg.image!.assetId) : undefined;
    const url = asset?.url || bg.image.url!;
    
    try {
      const img = await loadImage(url);
      const fit = bg.image.fit || 'cover';
      const scale = bg.image.scale || 1;
      const offsetX = bg.image.offsetX || 0;
      const offsetY = bg.image.offsetY || 0;
      const opacity = bg.image.opacity !== undefined ? bg.image.opacity : 1;
      
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Calculer les dimensions selon le fit
      const imgRatio = img.width / img.height;
      const canvasRatio = pxW / pxH;
      
      let drawW, drawH, drawX, drawY;
      
      if (fit === 'cover') {
        if (imgRatio > canvasRatio) {
          drawH = pxH * scale;
          drawW = drawH * imgRatio;
          drawX = (pxW - drawW) / 2;
          drawY = (pxH - drawH) / 2;
        } else {
          drawW = pxW * scale;
          drawH = drawW / imgRatio;
          drawX = (pxW - drawW) / 2;
          drawY = (pxH - drawH) / 2;
        }
      } else { // contain
        if (imgRatio > canvasRatio) {
          drawW = pxW * scale;
          drawH = drawW / imgRatio;
          drawX = (pxW - drawW) / 2;
          drawY = (pxH - drawH) / 2;
        } else {
          drawH = pxH * scale;
          drawW = drawH * imgRatio;
          drawX = (pxW - drawW) / 2;
          drawY = (pxH - drawH) / 2;
        }
      }
      
      // Appliquer les offsets
      drawX += (offsetX / 100) * (pxW / 4);
      drawY += (offsetY / 100) * (pxH / 4);
      
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch (error) {
      console.warn('Erreur chargement image fond:', error);
    }
  }

  // 3. Texture
  if (bg.texture && bg.texture.type !== 'none' && (bg.texture.opacity || 0) > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, bg.texture.opacity || 0.3));
    drawTexture(ctx, pxW, pxH, bg.texture.type);
    ctx.restore();
  }

  // 4. Texte en filigrane
  if (bg.kind === 'text' && bg.text && bg.text.content.trim()) {
    const { content, color, opacity, sizePct, rotation, font } = bg.text;
    
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity || 0.08));
    ctx.fillStyle = color || '#000000';
    
    const fontSize = Math.max(12, Math.round((sizePct || 40) / 100 * pxW));
    ctx.font = `bold ${fontSize}px ${font || 'serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.translate(pxW / 2, pxH / 2);
    ctx.rotate(((rotation || -20) * Math.PI) / 180);
    
    // Dessiner le texte ligne par ligne si nécessaire
    const lines = content.split('\n');
    const lineHeight = fontSize * 1.2;
    const startY = -(lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, startY + i * lineHeight);
    });
    
    ctx.restore();
  }

  // 5. Vignettage
  if (bg.vignette?.enabled && (bg.vignette.strength || 0) > 0) {
    const strength = Math.max(0, Math.min(1, bg.vignette.strength || 0.25));
    const alpha = 0.7 * strength;
    
    const gradient = ctx.createRadialGradient(
      pxW / 2, pxH / 2, Math.min(pxW, pxH) * 0.2,
      pxW / 2, pxH / 2, Math.max(pxW, pxH) * 0.7
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, pxW, pxH);
  }

  // 6. Bruit/Grain
  if (bg.noise?.enabled && (bg.noise.opacity || 0) > 0 && (bg.noise.amount || 0) > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, bg.noise.opacity || 0.15));
    drawNoise(ctx, pxW, pxH, Math.max(0, Math.min(1, bg.noise.amount || 0.15)), !!bg.noise.monochrome);
    ctx.restore();
  }
}
function drawTexture(ctx: CanvasRenderingContext2D, w: number, h: number, type: 'paper' | 'linen' | 'grid') {
  if (type === 'grid') {
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    const step = 24;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
    return;
  }
  
  // Texture papier ou lin
  const count = type === 'paper' ? 350 : 600;
  const maxLength = type === 'paper' ? 10 : 18;
  const lineWidth = type === 'paper' ? 0.6 : 0.4;
  
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.lineWidth = lineWidth;
  
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const length = maxLength * Math.random();
    const angle = Math.random() * Math.PI * 2;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }
}

function drawNoise(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, monochrome: boolean) {
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;
  const amplitude = Math.round(255 * amount);
  
  for (let i = 0; i < data.length; i += 4) {
    if (monochrome) {
      const noise = Math.floor(Math.random() * amplitude);
      data[i] = noise;     // R
      data[i + 1] = noise; // G
      data[i + 2] = noise; // B
      data[i + 3] = 255;   // A
    } else {
      data[i] = Math.floor(Math.random() * amplitude);     // R
      data[i + 1] = Math.floor(Math.random() * amplitude); // G
      data[i + 2] = Math.floor(Math.random() * amplitude); // B
      data[i + 3] = 255;   // A
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}