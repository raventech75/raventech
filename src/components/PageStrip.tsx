'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

/* ---------- Miniature fidèle d'une page (CSS %) ---------- */
function MiniPage({ pageId }: { pageId: string }) {
  const st = useAlbumStore();
  const page = st.pages.find((x) => x.id === pageId)!;
  const { size } = st;

  // Fond comme dans l’aperçu (PreviewModal)
  const bgCss: React.CSSProperties = (() => {
    const bg = page.background;
    let background = '#FFFFFF';

    if (bg.kind === 'solid' && bg.solid) background = bg.solid.color;
    else if (bg.kind === 'linear' && bg.linear)
      background = `linear-gradient(${bg.linear.angle}deg, ${bg.linear.from}, ${bg.linear.to})`;
    else if (bg.kind === 'radial' && bg.radial)
      background = `radial-gradient(${bg.radial.shape}, ${bg.radial.inner}, ${bg.radial.outer})`;

    const style: React.CSSProperties = { background, position: 'absolute', inset: 0 };

    if (bg.kind === 'image' && bg.image && (bg.image.assetId || bg.image.url)) {
      const url = bg.image.url ?? undefined;
      if (url) {
        const fit = bg.image.fit ?? 'cover';
        (style as any).backgroundImage = `url(${url})`;
        (style as any).backgroundRepeat = 'no-repeat';
        (style as any).backgroundSize =
          fit === 'cover' ? `${(bg.image.scale ?? 1) * 100}% auto, cover` : 'contain';
        (style as any).backgroundPosition = `${50 + (bg.image.offsetX ?? 0)}% ${
          50 + (bg.image.offsetY ?? 0)
        }%`;
        (style as any).opacity = bg.image.opacity ?? 1;
      }
    }

    return style;
  })();

  return (
    <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
      {/* fond */}
      <div className="absolute inset-0" style={bgCss} />

      {/* items */}
      {page.items.map((it) => {
        const left = (it.x / size.w) * 100;
        const top = (it.y / size.h) * 100;
        const w = (it.w / size.w) * 100;
        const h = (it.h / size.h) * 100;

        const radius =
          it.borderRadiusMode === 'circle'
            ? '50%'
            : it.borderRadiusMode === 'squircle'
            ? '30% / 40%'
            : `${Math.max(0, Math.min(50, it.borderRadiusPct ?? 0))}%`;

        const feather = Math.max(0, Math.min(40, (it as any).featherPct ?? 0));
        const maskImage =
          feather > 0
            ? `radial-gradient(ellipse at center, black ${100 - feather}%, transparent 100%)`
            : undefined;

        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${left}%`,
          top: `${top}%`,
          width: `${w}%`,
          height: `${h}%`,
          transform: `rotate(${it.rot ?? 0}deg)`,
          transformOrigin: 'center',
          overflow: 'hidden',
          borderRadius: radius,
          opacity: (it as any).opacity ?? 1,
          WebkitMaskImage: maskImage as any,
          maskImage: maskImage as any,
        };

        if (it.kind === 'photo' && it.assetId) {
          const asset = st.assets.find((a) => a.id === it.assetId);
          return (
            <div key={it.id} style={style}>
              {asset ? (
                <img
                  src={(asset as any).previewUrl ?? asset.url}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                  style={{
                    transform: `translate(${(it as any).offsetXpct ?? 0}%, ${
                      (it as any).offsetYpct ?? 0
                    }%) scale(${(it as any).scale ?? 1})`,
                    transformOrigin: 'center',
                    display: 'block',
                  }}
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-[10px] text-slate-500">
                  Image
                </div>
              )}
            </div>
          );
        }

        if (it.kind === 'text') {
          return (
            <div
              key={it.id}
              style={style}
              className="p-[4%] text-[10px] leading-snug text-slate-800"
            >
              {it.text}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

/* ---------- Élément miniature avec sélection + drag & drop ---------- */
function PageThumb({
  pageId,
  index,
  selected,
  onClick,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: {
  pageId: string;
  index: number;
  selected: boolean;
  onClick: () => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}) {
  const st = useAlbumStore();

  return (
    <button
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(index);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      className={`relative shrink-0 mx-2 my-3 rounded-2xl border transition
        ${
          selected
            ? 'border-sky-500 ring-2 ring-sky-300/50'
            : 'border-slate-200 hover:border-slate-300'
        } bg-white`}
      style={{
        width: 200,                                   // plus compact
        aspectRatio: `${st.size.w} / ${st.size.h}`,   // ratio fidèle
        overflow: 'hidden',
      }}
      title={`Aller à la page ${index + 1}`}
    >
      {/* fond léger */}
      <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(0,0,0,.04)] bg-slate-50" />

      {/* contenu fidèle, non tronqué */}
      <div className="absolute inset-2 rounded-xl overflow-hidden bg-white">
        <div className="w-full h-full relative">
          <MiniPage pageId={pageId} />
        </div>
      </div>

      {/* badge index */}
      <span className="absolute bottom-2 right-2 h-6 w-6 grid place-items-center text-[12px] rounded-full bg-white/90 border border-slate-200">
        {index + 1}
      </span>
    </button>
  );
}

/* ---------- PageStrip principal ---------- */
export default function PageStrip() {
  const st = useAlbumStore();
  const pages = st.pages;
  const cur = st.currentPageIndex;

  // Drag & drop ordre
  const dragFrom = React.useRef<number | null>(null);
  const dragOver = React.useRef<number | null>(null);

  const onDragStart = (i: number) => {
    dragFrom.current = i;
    dragOver.current = i;
  };

  const onDragEnter = (i: number) => {
    dragOver.current = i;
  };

  const onDragEnd = () => {
    const from = dragFrom.current;
    const to = dragOver.current;
    dragFrom.current = null;
    dragOver.current = null;
    if (from == null || to == null || from === to) return;

    st.setPages((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      // réindex
      next.forEach((p, i) => (p.index = i));
      return next;
    });

    // focus sur la page déplacée
    st.setCurrentPage(to);
  };

  // Scroll suave sur sélection
  const listRef = React.useRef<HTMLDivElement>(null!);
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const sel = el.querySelectorAll('button')[cur] as HTMLElement | undefined;
    if (sel) {
      const r = sel.getBoundingClientRect();
      const lr = el.getBoundingClientRect();
      if (r.left < lr.left || r.right > lr.right) {
        el.scrollTo({ left: sel.offsetLeft - 40, behavior: 'smooth' });
      }
    }
  }, [cur]);

  return (
    <div className="w-full border-t border-slate-200 bg-white">
      <div className="relative">
        {/* flèches de scroll */}
        <ScrollButton side="left" targetRef={listRef as React.RefObject<HTMLDivElement>} />
        <ScrollButton side="right" targetRef={listRef as React.RefObject<HTMLDivElement>} />

        <div
          ref={listRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
        >
          <div className="flex items-stretch px-6">
            {pages.map((p) => (
              <PageThumb
                key={p.id}
                pageId={p.id}
                index={p.index}
                selected={cur === p.index}
                onClick={() => st.setCurrentPage(p.index)}
                onDragStart={onDragStart}
                onDragEnter={onDragEnter}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Boutons de scroll latéraux ---------- */
function ScrollButton({
  side,
  targetRef,
}: {
  side: 'left' | 'right';
  targetRef: React.RefObject<HTMLDivElement>;
}) {
  const onClick = () => {
    const el = targetRef.current;
    if (!el) return;
    const delta = el.clientWidth * 0.8 * (side === 'left' ? -1 : 1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };
  return (
    <button
      onClick={onClick}
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${
        side === 'left' ? 'left-1' : 'right-1'
      } h-8 w-8 rounded-full bg-white/90 border border-slate-200 shadow-sm hover:bg-white z-10 items-center justify-center`}
      title={side === 'left' ? 'Défiler à gauche' : 'Défiler à droite'}
      aria-label={side === 'left' ? 'Scroll left' : 'Scroll right'}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  );
}