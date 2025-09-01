'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import RightDock from '@/components/RightDock';

// IMPORTANT: charge EditorCanvas côté client uniquement
const EditorCanvas = dynamic(() => import('@/components/EditorCanvas'), {
  ssr: false,
});

export default function EditorPage() {
  return (
    <div className="relative h-[100dvh] w-full bg-slate-100">
      <TopBar />
      <div className="h-[calc(100dvh-48px)] w-full overflow-hidden">
        <EditorCanvas />
      </div>
      <RightDock />
    </div>
  );
}