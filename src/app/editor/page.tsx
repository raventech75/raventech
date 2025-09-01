// src/app/editor/page.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import RightDock from '@/components/RightDock';
import LeftSidebar from '@/components/LeftSidebar';

const EditorCanvas = dynamic(() => import('@/components/EditorCanvas'), { ssr: false });

export default function EditorPage() {
  return (
    <div className="relative h-[100dvh] w-full bg-slate-100 text-slate-900">
      <TopBar />
      <div className="relative h-[calc(100dvh-48px)] w-full">
        <div className="h-full w-full pl-[300px]">
          <EditorCanvas />
        </div>
        <LeftSidebar />
        <RightDock />
      </div>
    </div>
  );
}