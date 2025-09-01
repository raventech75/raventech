/* eslint-disable @typescript-eslint/no-explicit-any */
// /components/PlacementDrawer.tsx
"use client";
import React from "react";

type Thumb = { id: string; url: string; used?: boolean; label?: string };

export default function PlacementDrawer({
  items, onPick, title = "Photos à placer",
}: {
  items: Thumb[];
  onPick: (id: string) => void;
  title?: string;
}) {
  const [open, setOpen] = React.useState(true);
  const [q, setQ] = React.useState("");
  const filtered = items.filter(i => i.label?.toLowerCase().includes(q.toLowerCase()) ?? true);

  return (
    <div className="fixed right-3 bottom-3 z-30 w-[480px]">
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="font-medium">{title}</div>
          <button className="text-sm opacity-70" onClick={() => setOpen(o=>!o)}>{open ? "▾" : "▸"}</button>
        </div>
        {open && (
          <div className="px-4 pb-4">
            <input
              value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Rechercher…" className="w-full mb-3 rounded-xl px-3 py-2 bg-zinc-100 dark:bg-zinc-800 outline-none"
            />
            <div className="grid grid-cols-3 gap-3 max-h-[45vh] overflow-auto pr-1">
              {filtered.map((it) => (
                <button key={it.id} onClick={()=>onPick(it.id)}
                  className="relative group aspect-square overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <img src={it.url} className="object-cover w-full h-full group-hover:scale-[1.03] transition" />
                  {it.used && (
                    <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      utilisée
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}