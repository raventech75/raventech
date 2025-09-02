'use client';

import React from 'react';
import Toolbar from '@/components/Toolbar';
import TemplatesPanel from '@/components/TemplatesPanel';
import AssetsPanel from '@/components/AssetsPanel';
import EditorCanvas from '@/components/EditorCanvas';
import Sidebar from '@/components/Sidebar';

export default function EditorShell() {
  return (
    <div className="grid grid-rows-[auto_1fr] min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Barre du haut */}
      <Toolbar />

      {/* Corps principal */}
      <div className="grid grid-cols-[260px_1fr_300px] gap-3 min-h-0 px-3 pb-3">
        {/* Colonne gauche : Templates + Bibliothèque */}
        <div className="min-h-0 overflow-y-auto space-y-3">
          <TemplatesPanel />
          <AssetsPanel />
        </div>

        {/* Canvas central */}
        <EditorCanvas />

        {/* Colonne droite : propriétés / réglages */}
        <Sidebar />
      </div>
    </div>
  );
}