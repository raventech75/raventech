/* eslint-disable @typescript-eslint/no-explicit-any */
// /components/TextStyleBar.tsx
"use client";
import React from "react";
import { ensureGoogleFont } from "@/lib/fonts";

export type TextStyle = {
  color: string; weight: number; lineHeight: number; letterSpacing: number;
  fontFamily: string; fontSize: number; align: "left"|"center"|"right";
};

export default function TextStyleBar({
  value, onChange,
}:{
  value: TextStyle;
  onChange: (t: TextStyle)=>void;
}) {
  React.useEffect(()=> ensureGoogleFont(value.fontFamily, [300,400,500,600,700]), [value.fontFamily]);

  return (
    <div className="flex gap-2 items-center px-3 py-2 bg-white/80 dark:bg-zinc-900/70 backdrop-blur rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <select
        className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800"
        value={value.fontFamily}
        onChange={(e)=>onChange({...value, fontFamily: e.target.value})}
      >
        {["Inter","Lora","Playfair Display","Roboto","Roboto Slab","Montserrat","Poppins"].map(f=>(
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <input type="number" min={8} max={200} value={value.fontSize}
        onChange={e=>onChange({...value, fontSize: +e.target.value})}
        className="w-20 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      <input type="color" value={value.color}
        onChange={e=>onChange({...value, color: e.target.value})} />
      <select value={value.weight}
        onChange={e=>onChange({...value, weight: +e.target.value})}
        className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {[300,400,500,600,700,800,900].map(w=><option key={w} value={w}>{w}</option>)}
      </select>
      <label className="text-xs opacity-70">LH</label>
      <input type="number" value={value.lineHeight}
        onChange={e=>onChange({...value, lineHeight: +e.target.value})}
        className="w-16 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      <label className="text-xs opacity-70">LS</label>
      <input type="number" step={0.1} value={value.letterSpacing}
        onChange={e=>onChange({...value, letterSpacing: +e.target.value})}
        className="w-16 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      <div className="flex gap-1">
        {(["left","center","right"] as const).map(a=>(
          <button key={a} onClick={()=>onChange({...value, align: a})}
            className={`px-2 py-1 rounded-lg text-xs ${value.align===a?"bg-zinc-900 text-white dark:bg-white dark:text-black":"bg-zinc-100 dark:bg-zinc-800"}`}>
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}