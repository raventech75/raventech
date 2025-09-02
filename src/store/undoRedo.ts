// src/store/undoRedo.ts
'use client';
import { useEffect } from 'react';
import { useAlbumStore } from './useAlbumStore';

// We wrap a subset of mutations to snapshot 'pages' + 'assets' + 'currentIndex' + 'size' etc.
export type EditorSnapshot = {
  pages: any[];
  assets: any[];
  currentIndex: number;
  size: { w: number; h: number };
  bleedMm: number;
};

export function getSnapshot(st: any): EditorSnapshot {
  return {
    pages: JSON.parse(JSON.stringify(st.pages)),
    assets: JSON.parse(JSON.stringify(st.assets)),
    currentIndex: st.currentIndex,
    size: st.size,
    bleedMm: st.bleedMm,
  };
}

export const history = {
  past: [] as EditorSnapshot[],
  future: [] as EditorSnapshot[],
  push(s: EditorSnapshot) {
    this.past.push(s);
    if (this.past.length > 100) this.past.shift(); // cap history
    this.future = [];
  },
  canUndo() { return this.past.length > 0; },
  canRedo() { return this.future.length > 0; },
  undo(current: EditorSnapshot) {
    if (!this.canUndo()) return null;
    const prev = this.past.pop()!;
    this.future.push(current);
    return prev;
  },
  redo(current: EditorSnapshot) {
    if (!this.canRedo()) return null;
    const next = this.future.pop()!;
    this.past.push(current);
    return next;
  }
};

// Hook to install global keyboard shortcuts
export function useUndoRedoShortcuts() {
  const st = useAlbumStore();
  useEffect(()=>{
    function onKey(e: KeyboardEvent) {
      const z = (e.key.toLowerCase() === 'z');
      const y = (e.key.toLowerCase() === 'y');
      const meta = e.metaKey || e.ctrlKey;
      if (meta && z && !e.shiftKey) { e.preventDefault(); st.undo(); }
      else if ((meta && y) || (meta && z && e.shiftKey)) { e.preventDefault(); st.redo(); }
    }
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  }, [st]);
}
