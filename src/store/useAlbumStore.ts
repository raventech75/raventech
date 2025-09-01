/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { nanoid } from "nanoid";
import { supabaseBrowser } from "@/lib/supabase/browser";

/** --------- Types de base --------- */
export type AlbumSizeCm = { w: number; h: number; label: string };
export const ALBUM_SIZES: AlbumSizeCm[] = [
  { label: "15×21", w: 15, h: 21 },
  { label: "18×24", w: 18, h: 24 },
  { label: "30×20", w: 30, h: 20 },
  { label: "30×30", w: 30, h: 30 },
  { label: "40×30", w: 40, h: 30 },
];

export type Background =
  | { type: "solid"; color1: string }
  | { type: "linear"; color1: string; color2: string; angleDeg: number }
  | { type: "radial"; color1: string; color2: string };

export type PhotoAsset = {
  id: string;
  name: string;
  url: string;
  w: number;
  h: number;
  used?: boolean; // marqué si posé sur au moins une page
};

export type PhotoItem = {
  kind: "photo";
  id: string;
  assetId: string;
  ar: number; // ratio w/h d’origine – on le garde pour l’homothétie
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
};

export type TextItem = {
  kind: "text";
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontFamily: string;
  align: "left" | "center" | "right";
  rotation: number;
  color: string;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
};

export type Page = { id: string; items: (PhotoItem | TextItem)[] };
export type Project = { id: string; name: string };

/** --------- Helpers numériques sûrs --------- */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const asNum = (n: unknown) => Number.isFinite(Number(n)) ? Number(n) : NaN;
const safeNum = (n: unknown, fallback: number) => {
  const v = asNum(n);
  return Number.isFinite(v) ? v : fallback;
};
const safeDim = (n: unknown, min = 20) => {
  const v = asNum(n);
  return Number.isFinite(v) && v > 0 ? v : min;
};
const rectsOverlap = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
const safeARfromWH = (w?: number, h?: number) => {
  if (!w || !h) return 3 / 2;
  const ar = w / h;
  return ar > 0 ? ar : 3 / 2;
};

/** --------- Etat global --------- */
export type AlbumState = {
  // écran / métriques
  size: AlbumSizeCm;
  dpi: number;
  zoom: number;

  // guides
  showGrid: boolean;
  gridSize: number;
  showGuides: boolean;
  snap: boolean;

  // aimantation
  magnet: boolean;
  magnetTol: number;
  toggleMagnet: () => void;
  setMagnetTol: (n: number) => void;

  // zones d’impression
  bleedMm: number;
  safeMm: number;
  background: Background;

  cmToPx: (cm: number) => number;
  mmToPx: (mm: number) => number;

  // pages
  pages: Page[];
  pageCount: number;
  currentIndex: number;

  // assets (librairie)
  assets: PhotoAsset[];
  // pagination de la librairie (affichage en “pages” de vignettes)
  assetPage: number;
  assetsPerPage: number;
  setAssetPage: (p: number) => void;
  setAssetsPerPage: (n: number) => void;

  // sélection / outil
  selectedIds: string[];
  tool: "select" | "photo" | "text";
  setTool: (t: AlbumState["tool"]) => void;

  // commandes de base
  setSize: (s: AlbumSizeCm) => void;
  setZoom: (z: number) => void;

  toggleGrid: () => void;
  setGridSize: (n: number) => void;
  toggleGuides: () => void;
  toggleSnap: () => void;

  setBleedMm: (n: number) => void;
  setSafeMm: (n: number) => void;
  setBackground: (bg: Background) => void;

  goTo: (idx: number) => void;
  setPageCount: (n: number) => void;
  addPage: () => void;
  removePage: (idx: number) => void;

  // imports & gestion assets
  addAssets: (files: FileList | File[]) => Promise<void>;
  removeAsset: (id: string) => void;

  // placement des photos (librairie -> page)
  placePhoto: (assetId: string, x?: number | null, y?: number | null, targetW?: number | null) => void;
  placePhotoAuto: (assetId: string, baseTargetW?: number) => void;

  // texte
  addText: (x: number, y: number, text?: string) => void;

  // edition
  updateItem: (pageId: string, itemId: string, patch: Partial<PhotoItem | TextItem>) => void;
  deleteItem: (pageId: string, itemId: string) => void;
  clearPage: (pageId: string) => void;

  // sélection
  selectOnly: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  selectNone: () => void;

  // layouts
  autoLayout: (columns: 1 | 2 | 3 | 4) => void;
  autoLayoutAuto: () => void;
  autoLayoutMosaic: () => void;
  autoFill: (columns: 1 | 2 | 3 | 4) => void;

  // z-order / styles
  bringToFront: (pageId: string, itemId: string) => void;
  sendToBack: (pageId: string, itemId: string) => void;

  // persistance projets
  project: Project | null;
  setProject: (p: Project | null) => void;
  saveToSupabase: () => Promise<void>;
  loadFromSupabase: (projectId: string) => Promise<void>;
};

/** --------- Store --------- */
export const useAlbumStore = create<AlbumState>((set, get) => ({
  size: ALBUM_SIZES[3], // 30×30 par défaut
  dpi: 300,
  zoom: 0.42,

  showGrid: true,
  gridSize: 40,
  showGuides: true,
  snap: true,

  magnet: true,
  magnetTol: 8,
  toggleMagnet: () => set((s) => ({ magnet: !s.magnet })),
  setMagnetTol: (n) => set({ magnetTol: clamp(Math.floor(n), 1, 40) }),

  bleedMm: 5,
  safeMm: 10,
  background: { type: "solid", color1: "#ffffff" },

  cmToPx: (cm: number) => (get().dpi / 2.54) * cm,
  mmToPx: (mm: number) => (get().dpi / 25.4) * mm,

  pages: [{ id: nanoid(), items: [] }],
  pageCount: 2,
  currentIndex: 0,

  assets: [],
  assetPage: 1,
  assetsPerPage: 12,
  setAssetPage: (p) => set({ assetPage: Math.max(1, Math.floor(p)) }),
  setAssetsPerPage: (n) => set({ assetsPerPage: clamp(Math.floor(n), 6, 60) }),

  selectedIds: [],
  tool: "select",
  setTool: (t) => set({ tool: t }),

  setSize: (s) => set({ size: s }),
  setZoom: (z) => set({ zoom: clamp(z, 0.1, 3) }),

  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setGridSize: (n) => set({ gridSize: clamp(Math.floor(n), 8, 200) }),
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  toggleSnap: () => set((s) => ({ snap: !s.snap })),

  setBleedMm: (n) => set({ bleedMm: Math.max(0, n) }),
  setSafeMm: (n) => set({ safeMm: Math.max(0, n) }),
  setBackground: (bg) => set({ background: bg }),

  goTo: (idx) => set((s) => ({ currentIndex: clamp(idx, 0, s.pages.length - 1), selectedIds: [] })),

  setPageCount: (n) =>
    set((s) => {
      const target = clamp(Math.floor(n), 2, 25);
      const pages = s.pages.slice(0, target);
      while (pages.length < target) pages.push({ id: nanoid(), items: [] });
      return {
        pageCount: target,
        pages,
        currentIndex: Math.min(s.currentIndex, pages.length - 1),
      };
    }),

  addPage: () =>
    set((s) => {
      if (s.pages.length >= 25) return s;
      return {
        pages: [...s.pages, { id: nanoid(), items: [] }],
        pageCount: s.pageCount + 1,
        currentIndex: s.pages.length,
      };
    }),

  removePage: (idx) =>
    set((s) => {
      if (s.pages.length <= 1) return s;
      const pages = s.pages.slice();
      const removed = pages.splice(idx, 1)[0];

      // libère les assets qui ne sont plus utilisés nulle part
      const removedUsed = new Set(
        removed.items.filter((i) => (i as any).kind === "photo").map((i) => (i as PhotoItem).assetId)
      );
      const stillUsed = new Set(
        pages
          .flatMap((p) => p.items)
          .filter((i) => (i as any).kind === "photo")
          .map((i) => (i as PhotoItem).assetId)
      );
      const assets = s.assets.map((a) => (removedUsed.has(a.id) && !stillUsed.has(a.id) ? { ...a, used: false } : a));

      return {
        assets,
        pages,
        pageCount: Math.max(2, s.pageCount - 1),
        currentIndex: Math.min(s.currentIndex, pages.length - 1),
        selectedIds: [],
      };
    }),

  /** ---- Import très rapide + append (affichage à la suite) ---- */
  addAssets: async (files) => {
    const list = Array.from(files);
    const limit = Math.max(0, 150 - get().assets.length);
    const slice = list.slice(0, limit);

    // decode 1 image (ultra rapide via ImageBitmap)
    const decodeOne = async (f: File) => {
      try {
        const bmp = await createImageBitmap(f);
        const url = URL.createObjectURL(f);
        // @ts-ignore
        bmp.close?.();
        const w = Math.max(1, bmp.width || 1000);
        const h = Math.max(1, bmp.height || 667);
        return { id: nanoid(), name: f.name, url, w, h, used: false } as PhotoAsset;
      } catch {
        const url = URL.createObjectURL(f);
        const dim = await new Promise<{ w: number; h: number }>((res) => {
          const im = new Image();
          im.onload = () => res({ w: im.naturalWidth || 1000, h: im.naturalHeight || 667 });
          im.src = url;
        });
        return {
          id: nanoid(),
          name: f.name,
          url,
          w: Math.max(1, dim.w),
          h: Math.max(1, dim.h),
          used: false,
        } as PhotoAsset;
      }
    };

    // on les ajoute dans l'ordre -> “à la suite” visuellement
    const decoded: PhotoAsset[] = [];
    for (const f of slice) {
      if ("requestIdleCallback" in window) {
        await new Promise<void>((r) => (window as any).requestIdleCallback(() => r()));
      }
      decoded.push(await decodeOne(f));
    }
    set((s) => ({
      assets: [...s.assets, ...decoded],
      // remet la pagination à la dernière “page” pour voir ce qu’on vient d’ajouter
      assetPage: Math.ceil((s.assets.length + decoded.length) / s.assetsPerPage),
    }));
  },

  removeAsset: (id) =>
    set((s) => {
      const a = s.assets.find((x) => x.id === id);
      if (a) URL.revokeObjectURL(a.url);
      const assets = s.assets.filter((x) => x.id !== id);
      return {
        assets,
        assetPage: Math.min(s.assetPage, Math.max(1, Math.ceil(assets.length / s.assetsPerPage))),
      };
    }),

  /** ---- Placement automatique sur la zone utile, sans chevauchement, homothétie conservée ---- */
  placePhotoAuto: (assetId, baseTargetW) =>
    set((s) => {
      const asset = s.assets.find((a) => a.id === assetId);
      if (!asset) return s;

      const W = get().cmToPx(s.size.w * 2);
      const H = get().cmToPx(s.size.h);
      const bleed = get().mmToPx(s.bleedMm);
      const A = { x: bleed, y: bleed, w: W - 2 * bleed, h: H - 2 * bleed };

      const ar = safeARfromWH(asset.w, asset.h);
      let w = safeDim(baseTargetW ?? A.w * 0.44, 40);
      if (w > A.w) w = A.w;
      let h = Math.round(w / ar);
      if (h > A.h) {
        h = A.h;
        w = Math.round(h * ar);
      }

      const page = s.pages[s.currentIndex];
      const others = page.items.filter((i) => (i as any).kind === "photo") as PhotoItem[];

      const step = 16;
      let placedX = A.x,
        placedY = A.y,
        okFound = false;

      outer: for (let yy = A.y; yy <= A.y + A.h - h; yy += step) {
        for (let xx = A.x; xx <= A.x + A.w - w; xx += step) {
          const me = { x: xx, y: yy, w, h };
          let ok = true;
          for (const o of others) {
            const ob = { x: o.x, y: o.y, w: o.width, h: o.height };
            if (rectsOverlap(me, ob)) {
              ok = false;
              break;
            }
          }
          if (ok) {
            placedX = xx;
            placedY = yy;
            okFound = true;
            break outer;
          }
        }
      }

      if (!okFound) {
        for (let scale = 0.9; scale >= 0.5; scale -= 0.1) {
          const tw = Math.round(w * scale),
            th = Math.round(h * scale);
          outer2: for (let yy = A.y; yy <= A.y + A.h - th; yy += step) {
            for (let xx = A.x; xx <= A.x + A.w - tw; xx += step) {
              const me = { x: xx, y: yy, w: tw, h: th };
              let ok = true;
              for (const o of others) {
                const ob = { x: o.x, y: o.y, w: o.width, h: o.height };
                if (rectsOverlap(me, ob)) {
                  ok = false;
                  break;
                }
              }
              if (ok) {
                placedX = xx;
                placedY = yy;
                w = tw;
                h = th;
                okFound = true;
                break outer2;
              }
            }
          }
          if (okFound) break;
        }
      }

      const item: PhotoItem = {
        kind: "photo",
        id: nanoid(),
        assetId,
        ar,
        x: Math.round(placedX),
        y: Math.round(placedY),
        width: Math.round(w),
        height: Math.round(h),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      };

      const pages = s.pages.slice();
      pages[s.currentIndex] = { ...page, items: [...page.items, item] };
      const assets = s.assets.map((a) => (a.id === assetId ? { ...a, used: true } : a));
      return { pages, assets, selectedIds: [item.id] };
    }),

  /** compat : place à x/y sinon auto */
  placePhoto: (assetId, x = null, y = null, targetW = null) => {
    if (x == null || y == null) {
      get().placePhotoAuto(assetId, targetW ?? undefined);
      return;
    }
    set((s) => {
      const asset = s.assets.find((a) => a.id === assetId);
      if (!asset) return s;
      const ar = safeARfromWH(asset.w, asset.h);
      const width = Math.round(safeDim(targetW ?? 300, 40));
      const height = Math.round(Math.max(40, width / ar));
      const page = s.pages[s.currentIndex];
      const item: PhotoItem = {
        kind: "photo",
        id: nanoid(),
        assetId,
        ar,
        x: Math.round(safeNum(x, 0)),
        y: Math.round(safeNum(y, 0)),
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      };
      const pages = s.pages.slice();
      pages[s.currentIndex] = { ...page, items: [...page.items, item] };
      const assets = s.assets.map((a) => (a.id === assetId ? { ...a, used: true } : a));
      return { pages, assets, selectedIds: [item.id] };
    });
  },

  /** ---- Texte ---- */
  addText: (x, y, text = "Votre titre") =>
    set((s) => {
      const page = s.pages[s.currentIndex];
      const item: TextItem = {
        kind: "text",
        id: nanoid(),
        text,
        x: Math.round(safeNum(x, 20)),
        y: Math.round(safeNum(y, 20)),
        width: 480,
        fontSize: 48,
        fontFamily: "Inter, system-ui, sans-serif",
        align: "left",
        rotation: 0,
        color: "#000",
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: 1.2,
      };
      const pages = s.pages.slice();
      pages[s.currentIndex] = { ...page, items: [...page.items, item] };
      return { pages, selectedIds: [item.id], tool: "select" };
    }),

  /** ---- Edition item (homothétie verrouillée pour les photos) ---- */
  updateItem: (pageId, itemId, patch) =>
    set((s) => {
      const pages = s.pages.map((pg) => {
        if (pg.id !== pageId) return pg;
        return {
          ...pg,
          items: pg.items.map((it) => {
            if (it.id !== itemId) return it;
            if ((it as any).kind === "photo") {
              const cur = it as PhotoItem;
              const p = patch as Partial<PhotoItem>;
              const asset = s.assets.find((a) => a.id === cur.assetId);
              const ar = cur.ar || safeARfromWH(asset?.w, asset?.h);

              // recalcul homothétique si width/height fournis
              let width = safeDim(p.width ?? cur.width, 20);
              let height = safeDim(p.height ?? cur.height, 20);
              if ("width" in p && !("height" in p)) height = Math.round(width / ar);
              if ("height" in p && !("width" in p)) width = Math.round(height * ar);

              return {
                ...cur,
                ...p,
                ar,
                x: Math.round(safeNum(p.x ?? cur.x, cur.x)),
                y: Math.round(safeNum(p.y ?? cur.y, cur.y)),
                width,
                height,
                rotation: safeNum(p.rotation ?? cur.rotation, cur.rotation),
                scaleX: 1,
                scaleY: 1,
                opacity: safeNum(p.opacity ?? cur.opacity, cur.opacity),
              } as PhotoItem;
            }
            // texte
            return { ...(it as TextItem), ...(patch as Partial<TextItem>) };
          }),
        };
      });
      return { pages };
    }),

  deleteItem: (pageId, itemId) =>
    set((s) => {
      const pg = s.pages.find((p) => p.id === pageId)!;
      const it = pg.items.find((i) => i.id === itemId);
      let assets = s.assets;
      if (it && (it as any).kind === "photo") {
        const assetId = (it as PhotoItem).assetId;
        const still = s.pages
          .flatMap((p) => p.items)
          .some((i) => (i as any).kind === "photo" && (i as PhotoItem).assetId === assetId && i.id !== itemId);
        if (!still) assets = assets.map((a) => (a.id === assetId ? { ...a, used: false } : a));
      }
      const pages = s.pages.map((pg2) =>
        pg2.id !== pageId ? pg2 : { ...pg2, items: pg2.items.filter((i) => i.id !== itemId) }
      );
      return { pages, assets, selectedIds: [] };
    }),

  clearPage: (pageId) =>
    set((s) => {
      const pg = s.pages.find((p) => p.id === pageId)!;
      const usedIds = new Set(pg.items.filter((i) => (i as any).kind === "photo").map((i) => (i as PhotoItem).assetId));
      const stillUsed = new Set(
        s.pages
          .filter((p) => p.id !== pageId)
          .flatMap((p) => p.items)
          .filter((i) => (i as any).kind === "photo")
          .map((i) => (i as PhotoItem).assetId)
      );
      const assets = s.assets.map((a) => (usedIds.has(a.id) && !stillUsed.has(a.id) ? { ...a, used: false } : a));
      return { pages: s.pages.map((p) => (p.id !== pageId ? p : { ...p, items: [] })), assets, selectedIds: [] };
    }),

  selectOnly: (id) => set({ selectedIds: id ? [id] : [] }),
  toggleSelect: (id) =>
    set((s) =>
      s.selectedIds.includes(id) ? { selectedIds: s.selectedIds.filter((x) => x !== id) } : { selectedIds: [...s.selectedIds, id] }
    ),
  selectNone: () => set({ selectedIds: [] }),

  /** ---- Layouts ---- */
  autoLayout: (columns) =>
    set((s) => {
      const pg = s.pages[s.currentIndex];
      const photos = pg.items.filter((i) => (i as any).kind === "photo") as PhotoItem[];
      if (!photos.length) return s as any;

      const W = get().cmToPx(s.size.w * 2),
        H = get().cmToPx(s.size.h);
      const bleed = get().mmToPx(s.bleedMm);
      const A = { x: bleed, y: bleed, w: W - 2 * bleed, h: H - 2 * bleed };
      const n = photos.length,
        cols = columns,
        rows = Math.ceil(n / cols);
      const cellW = A.w / cols,
        cellH = A.h / rows;

      photos.forEach((it, idx) => {
        const r = Math.floor(idx / cols),
          c = idx % cols;
        const cell = { x: A.x + c * cellW, y: A.y + r * cellH, w: cellW, h: cellH };
        const ar = it.ar || 3 / 2;
        const arBox = cell.w / cell.h;
        let w: number, h: number;
        if (ar > arBox) {
          w = Math.round(cell.w);
          h = Math.round(w / ar);
        } else {
          h = Math.round(cell.h);
          w = Math.round(h * ar);
        }
        it.width = w;
        it.height = h;
        it.x = Math.round(cell.x + (cell.w - w) / 2);
        it.y = Math.round(cell.y + (cell.h - h) / 2);
        it.scaleX = 1;
        it.scaleY = 1;
      });

      const pages = s.pages.slice();
      pages[s.currentIndex] = { ...pg, items: pg.items.slice() };
      return { pages };
    }),

  autoLayoutAuto: () =>
    set((s) => {
      const pg = s.pages[s.currentIndex];
      const n = pg.items.filter((i) => (i as any).kind === "photo").length;
      if (!n) return s as any;
      const cols = clamp(Math.round(Math.sqrt(n)), 1, 4) as 1 | 2 | 3 | 4;
      get().autoLayout(cols);
      return get() as any;
    }),

  autoLayoutMosaic: () =>
    set((s) => {
      const pg = s.pages[s.currentIndex];
      const photos = pg.items.filter((i) => (i as any).kind === "photo") as PhotoItem[];
      if (!photos.length) return s as any;

      const W = get().cmToPx(s.size.w * 2),
        H = get().cmToPx(s.size.h);
      const bleed = get().mmToPx(s.bleedMm);
      const A = { x: bleed, y: bleed, w: W - 2 * bleed, h: H - 2 * bleed };
      const zones: { x: number; y: number; w: number; h: number }[] = [];
      const push = (x: number, y: number, w: number, h: number) => zones.push({ x, y, w, h });
      const n = photos.length;

      if (n === 1) {
        push(A.x, A.y, A.w, A.h);
      } else if (n === 2) {
        push(A.x, A.y, A.w / 2, A.h);
        push(A.x + A.w / 2, A.y, A.w / 2, A.h);
      } else if (n === 3) {
        push(A.x, A.y, A.w * 0.6, A.h);
        push(A.x + A.w * 0.6, A.y, A.w * 0.4, A.h * 0.5);
        push(A.x + A.w * 0.6, A.y + A.h * 0.5, A.w * 0.4, A.h * 0.5);
      } else if (n === 4) {
        push(A.x, A.y, A.w, A.h * 0.55);
        const y = A.y + A.h * 0.55,
          h = A.h * 0.45,
          w = A.w / 3;
        push(A.x, y, w, h);
        push(A.x + w, y, w, h);
        push(A.x + 2 * w, y, w, h);
      } else {
        // si beaucoup de photos -> grille auto
        const cols = clamp(Math.round(Math.sqrt(n)), 1, 4) as 1 | 2 | 3 | 4;
        get().autoLayout(cols);
        return get() as any;
      }

      photos.slice(0, zones.length).forEach((it, i) => {
        const z = zones[i];
        const ar = it.ar || 3 / 2;
        const arBox = z.w / z.h;
        let w: number, h: number;
        if (ar > arBox) {
          w = Math.round(z.w);
          h = Math.round(w / ar);
        } else {
          h = Math.round(z.h);
          w = Math.round(h * ar);
        }
        it.width = w;
        it.height = h;
        it.x = Math.round(z.x + (z.w - w) / 2);
        it.y = Math.round(z.y + (z.h - h) / 2);
        it.scaleX = 1;
        it.scaleY = 1;
      });

      const pages = s.pages.slice();
      pages[s.currentIndex] = { ...pg, items: pg.items.slice() };
      return { pages };
    }),

  autoFill: (columns) =>
    set((s) => {
      const pg = s.pages[s.currentIndex];
      const usedHere = new Set(pg.items.filter((i) => (i as any).kind === "photo").map((i) => (i as PhotoItem).assetId));
      const candidates = s.assets.filter((a) => !a.used && !usedHere.has(a.id)).slice(0, Math.max(1, columns));
      candidates.forEach((asset) =>
        get().placePhotoAuto(asset.id, (get().cmToPx(s.size.w * 2) - 2 * get().mmToPx(s.bleedMm)) / 3)
      );
      // puis range
      get().autoLayoutAuto();
      return get() as any;
    }),

  /** ---- Z-order ---- */
  bringToFront: (pageId, itemId) =>
    set((s) => {
      const pages = s.pages.map((pg) => {
        if (pg.id !== pageId) return pg;
        const items = pg.items.slice();
        const idx = items.findIndex((it) => it.id === itemId);
        if (idx >= 0) {
          const [it] = items.splice(idx, 1);
          items.push(it);
        }
        return { ...pg, items };
      });
      return { pages };
    }),
  sendToBack: (pageId, itemId) =>
    set((s) => {
      const pages = s.pages.map((pg) => {
        if (pg.id !== pageId) return pg;
        const items = pg.items.slice();
        const idx = items.findIndex((it) => it.id === itemId);
        if (idx >= 0) {
          const [it] = items.splice(idx, 1);
          items.unshift(it);
        }
        return { ...pg, items };
      });
      return { pages };
    }),

  /** ---- Persistance Supabase (simple) ---- */
  project: null,
  setProject: (p) => set({ project: p }),
  saveToSupabase: async () => {
    const st = get();
    if (!st.project) throw new Error("Aucun projet");
    const id = st.project.id;

    await supabaseBrowser
      .from("projects")
      .upsert({ id, name: st.project.name, size: st.size, page_count: st.pageCount, background: st.background, bleed_mm: st.bleedMm, safe_mm: st.safeMm });

    await supabaseBrowser.from("pages").delete().eq("project_id", id);
    await supabaseBrowser.from("items").delete().eq("project_id", id);

    const pagesPayload = st.pages.map((p, idx) => ({ id: p.id, project_id: id, index: idx }));
    if (pagesPayload.length) await supabaseBrowser.from("pages").insert(pagesPayload);

    const itemsPayload = st.pages.flatMap((p) =>
      p.items.map((it: any) => ({ id: it.id, project_id: id, page_id: p.id, kind: it.kind, data: it }))
    );
    if (itemsPayload.length) await supabaseBrowser.from("items").insert(itemsPayload);
  },
  loadFromSupabase: async (projectId) => {
    const { data: proj } = await supabaseBrowser.from("projects").select("*").eq("id", projectId).maybeSingle();
    if (!proj) throw new Error("Projet introuvable");
    const { data: ps } = await supabaseBrowser.from("pages").select("*").eq("project_id", projectId).order("index");
    const { data: its } = await supabaseBrowser.from("items").select("*").eq("project_id", projectId);

    const pages: Page[] = (ps || []).map((p: any) => ({
      id: p.id,
      items: (its || [])
        .filter((it: any) => it.page_id === p.id)
        .map((it: any) => it.data),
    }));

    set({
      project: { id: proj.id, name: proj.name },
      size: proj.size,
      pageCount: proj.page_count,
      background: proj.background,
      bleedMm: proj.bleed_mm,
      safeMm: proj.safe_mm,
      pages: pages.length ? pages : [{ id: nanoid(), items: [] }],
      currentIndex: 0,
      selectedIds: [],
    });
  },
}));