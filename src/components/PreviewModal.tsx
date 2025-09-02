'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

const cmToPx96 = (cm: number) => (cm / 2.54) * 96;

export default function PreviewModal() {
  const st = useAlbumStore();
  const { ui, size, pages, assets } = st;

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  // Fit-to-window (sans changer le zoom global du canvas)
  React.useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const pad = 48; // marges internes du modal
      const vw = wrap.clientWidth - pad;
      const vh = wrap.clientHeight - pad;

      const pagePxW = cmToPx96(size.w);
      const pagePxH = cmToPx96(size.h);

      const s = Math.max(0.05, Math.min(vw / pagePxW, vh / pagePxH));
      setScale(s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [size.w, size.h]);

  if (!ui.previewOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
      onClick={st.closePreview}
      aria-modal
      role="dialog"
    >
      <div
        ref={wrapRef}
        className="absolute inset-0 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-white/90 text-sm">
            Aperçu — {pages.length} page{pages.length > 1 ? 's' : ''}
          </div>
          <button
            className="h-9 px-4 rounded-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            onClick={st.closePreview}
          >
            Fermer
          </button>
        </div>

        {/* Pages */}
        <div className="flex-1 overflow-auto px-6 pb-10">
          <div className="mx-auto max-w-[1800px] grid gap-10 md:grid-cols-1">
            {pages.map((p) => (
              <PagePreview
                key={p.id}
                pageId={p.id}
                scale={scale}
                sizeCm={size}
                assets={assets}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== PagePreview : DOM fidèle au canvas, avec les JPEG ORIGINAUX ===== */
function PagePreview({
  pageId,
  sizeCm,
  scale,
  assets,
}: {
  pageId: string;
  sizeCm: { w: number; h: number };
  scale: number;
  assets: ReturnType<typeof useAlbumStore.getState>['assets'];
}) {
  const st = useAlbumStore();
  const page = st.pages.find((x) => x.id === pageId)!;

  const pageW = cmToPx96(sizeCm.w) * scale;
  const pageH = cmToPx96(sizeCm.h) * scale;

  // Background CSS (identique EditorCanvas, mais ici on force l'URL originale)
  const bgCss: React.CSSProperties = (() => {
    const bg = page.background;
    let style: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      background: '#FFFFFF',
    };

    if (bg.kind === 'solid' && bg.solid) {
      style.background = bg.solid.color;
    } else if (bg.kind === 'linear' && bg.linear) {
      style.background = `linear-gradient(${bg.linear.angle}deg, ${bg.linear.from}, ${bg.linear.to})`;
    } else if (bg.kind === 'radial' && bg.radial) {
      style.background = `radial-gradient(${bg.radial.shape}, ${bg.radial.inner}, ${bg.radial.outer})`;
    }

    if (bg.kind === 'image' && bg.image && (bg.image.assetId || bg.image.url)) {
      const asset = bg.image.assetId ? assets.find(a => a.id === bg.image!.assetId) : undefined;
      const url = asset?.url || bg.image.url!;
      const fit = bg.image.fit ?? 'cover';
      (style as any).backgroundImage = `url(${url})`;
      (style as any).backgroundRepeat = 'no-repeat';
      (style as any).backgroundPosition = `${50 + (bg.image.offsetX ?? 0)}% ${50 + (bg.image.offsetY ?? 0)}%`;
      (style as any).backgroundSize = fit === 'cover' ? `${(bg.image.scale ?? 1) * 100}% auto, cover` : 'contain';
      (style as any).opacity = bg.image.opacity ?? 1;
    }

    return style;
  })();

  return (
    <div
      className="relative bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,.06),0_10px_30px_rgba(0,0,0,.12)] overflow-hidden mx-auto"
      style={{ width: pageW, height: pageH }}
    >
      {/* Fond */}
      <div style={bgCss} />

      {/* Items */}
      {page.items
        .slice()
        .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
        .map((it) => {
          const left = (it.x / sizeCm.w) * 100;
          const top = (it.y / sizeCm.h) * 100;
          const w = (it.w / sizeCm.w) * 100;
          const h = (it.h / sizeCm.h) * 100;

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

          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${left}%`,
            top: `${top}%`,
            width: `${w}%`,
            height: `${h}%`,
            transform: `rotate(${it.rot ?? 0}deg)`,
            transformOrigin: 'center',
            overflow: 'hidden',
            borderRadius: radius,
            opacity: it.opacity ?? 1,
            WebkitMaskImage: maskImage as any,
            maskImage: maskImage as any,
          };

          if (it.kind === 'photo' && it.assetId) {
            const asset = assets.find((a) => a.id === it.assetId);
            return (
              <div key={it.id} style={baseStyle}>
                {asset ? (
                  // IMPORTANT : on affiche l’URL ORIGINALE (pas la preview)
                  <img
                    src={asset.url}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-cover"
                    style={{
                      transform: `translate(${(it as any).offsetXpct ?? 0}%, ${(it as any).offsetYpct ?? 0}%) scale(${(it as any).scale ?? 1})`,
                      transformOrigin: 'center',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[12px] text-slate-500">
                    Image manquante
                  </div>
                )}
              </div>
            );
          }

          if (it.kind === 'text') {
            return (
              <div
                key={it.id}
                style={baseStyle}
                className="p-[4%] text-[13px] leading-snug text-slate-800"
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