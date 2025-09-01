'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import RightDock from '@/components/RightDock';
import LeftSidebar from '@/components/LeftSidebar';

// EditorCanvas doit rester côté client
const EditorCanvas = dynamic(() => import('@/components/EditorCanvas'), { ssr: false });

export default function EditorPage() {
  return (
    <div className="relative h-[100dvh] w-full bg-slate-100 text-slate-900">
      <TopBar />

      {/* Contenu principal */}
      <div className="relative h-[calc(100dvh-48px)] w-full">
        {/* marge pour la sidebar gauche (280px) */}
        <div className="h-full w-full pl-[280px]">
          <EditorCanvas />
        </div>

        {/* panneaux latéraux */}
        <LeftSidebar />
        <RightDock />
      </div>
    </div>
  );
}