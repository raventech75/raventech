'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import Toolbar from '@/components/Toolbar';
import PlaceFromLibrary from '@/components/PlaceFromLibrary';
import AssetDock from '@/components/AssetDock';

const EditorCanvas = dynamic(() => import('@/components/EditorCanvas'), { ssr: false });

<form action="/api/auth/sign-out" method="post">
  <button
    className="rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800"
    type="submit"
  >
    Se déconnecter
  </button>
</form>

export default function EditorPage() {
  return (
    <div className="grid grid-rows-[auto_1fr] min-h-screen bg-slate-100">
      <Toolbar />
      <div className="grid grid-cols-[320px_1fr_320px] min-h-0">
        <Sidebar />
        <EditorCanvas />
        <PlaceFromLibrary />
      </div>
      <AssetDock />
    </div>
  );
}