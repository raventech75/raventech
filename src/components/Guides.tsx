/* eslint-disable @typescript-eslint/no-explicit-any */
// /components/Guides.tsx
"use client";
import React from "react";
export default function Guides({ guides }:{ guides:{type:"v"|"h"; at:number}[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {guides.map((g,i)=> g.type==="v"
        ? <div key={i} className="absolute top-0 bottom-0 border-l border-fuchsia-500/80" style={{left:g.at}}/>
        : <div key={i} className="absolute left-0 right-0 border-t border-fuchsia-500/80" style={{top:g.at}}/>
      )}
    </div>
  );
}