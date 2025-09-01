/* eslint-disable @typescript-eslint/no-explicit-any */
// /components/ImportDrawer.tsx
"use client";
import React from "react";

export default function ImportDrawer({
  children, title = "Importation",
}: React.PropsWithChildren<{ title?: string }>) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="fixed left-3 bottom-3 z-30 w-[360px]">
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
          onClick={() => setOpen(o => !o)}
        >
          <span>{title}</span>
          <span className="opacity-60">{open ? "▾" : "▸"}</span>
        </button>
        {open && (
          <div className="max-h-[40vh] overflow-auto px-3 pb-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}