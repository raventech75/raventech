// src/store/types.d.ts

export type Tool = 'select' | 'photo' | 'text';

export type Align = 'left' | 'center' | 'right';

export type AlbumSizeCm = {
  w: number; // largeur d'une page (pas la double-page) en cm
  h: number; // hauteur d'une page en cm
};

export type Project = {
  id?: string;
  name?: string;
} | null;

export type Asset = {
  id: string;
  url: string;
  name?: string;
  width?: number;
  height?: number;
};

export type ItemBase = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
};

export type ItemPhoto = ItemBase & {
  kind: 'photo';
  assetId: string;
  width: number;
  height: number;
};

export type ItemText = ItemBase & {
  kind: 'text';
  text: string;
  fontSize: number;
  color: string;
  align: Align;
  width?: number;
  height?: number;
};

export type Page = {
  id: string;
  items: Array<ItemPhoto | ItemText>;
};

export type AlbumSnapshot = {
  pages: Page[];
  assets: Asset[];
  currentIndex: number;
  size: AlbumSizeCm;
  bleedMm: number;
  zoom: number;
  showGrid: boolean;
  showGuides: boolean;
  snap: boolean;
  magnet: boolean;
  magnetTol: number;
  gridSize: number;
  selectedIds: string[];
  tool: Tool;
  project: Project;
  dpi: number;
};

// … (le reste inchangé)

export type AlbumSnapshot = {
  // …
  bleedMm: number;
  safeMm: number;            //  ← AJOUT
  // …
};

export type AlbumState = {
  // État
  // …
  bleedMm: number;
  safeMm: number;            //  ← AJOUT
  // …

  // Mutateurs / actions
  // …
  setBleed: (mm: number) => void;
  setSafe: (mm: number) => void;   //  ← AJOUT
  // …
};

export type AlbumState = {
  // État
  size: AlbumSizeCm;
  dpi: number;
  zoom: number;
  pages: Page[];
  assets: Asset[];
  currentIndex: number;
  bleedMm: number;
  showGrid: boolean;
  showGuides: boolean;
  snap: boolean;
  magnet: boolean;
  magnetTol: number;
  gridSize: number;
  selectedIds: string[];
  tool: Tool;
  project: Project;

  // Helpers
  cmToPx: (cm: number) => number;

  // Mutateurs / actions
  setTool: (t: Tool) => void;
  setZoom: (z: number) => void;
  setGridSize: (n: number) => void;
  toggleGrid: () => void;
  toggleGuides: () => void;
  toggleSnap: () => void;
  toggleMagnet: () => void;
  setMagnetTol: (n: number) => void;
  setSize: (s: AlbumSizeCm) => void;
  setBleed: (mm: number) => void;
  setProject: (p: Project) => void;

  goTo: (index: number) => void;
  addPage: () => void;
  removePage: (index: number) => void;
  clearPage: (pageId: string) => void;

  setSelected: (ids: string[]) => void;
  addText: (text?: string) => void;
  updateItem: (pageId: string, itemId: string, patch: Partial<ItemPhoto & ItemText>) => void;
  deleteItem: (pageId: string, itemId: string) => void;

  autoLayout: (cols: 1 | 2 | 3 | 4) => void;
  autoLayoutAuto: () => void;
  autoLayoutMosaic: () => void;
  autoFill: (cols: 1 | 2 | 3 | 4) => void;

  // Historique
  undo: () => void;
  redo: () => void;
};
export type AlbumSnapshot = {
  // …
  bleedMm: number;
  safeMm: number;
  showOverlays: boolean;  // ← AJOUT
  // …
};

export type AlbumState = {
  // État
  // …
  bleedMm: number;
  safeMm: number;         // ← AJOUT
  showOverlays: boolean;  // ← AJOUT
  // …

  // Mutateurs / actions
  // …
  setBleed: (mm: number) => void;
  setSafe: (mm: number) => void;               // ← AJOUT
  setShowOverlays: (v: boolean) => void;       // ← AJOUT
  // …
};