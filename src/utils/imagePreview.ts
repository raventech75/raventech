// src/utils/imagePreview.ts
export async function makePreviewBlobUrl(
  fileOrUrl: File | string,
  maxSide = 1600,
  quality = 0.85
): Promise<{ previewUrl: string; ar: number }> {
  const bmp = await loadBitmap(fileOrUrl);
  const iw = (bmp as any).width ?? (bmp as any).bitmapWidth ?? (bmp as ImageBitmap).width;
  const ih = (bmp as any).height ?? (bmp as any).bitmapHeight ?? (bmp as ImageBitmap).height;
  const ar = iw / ih;

  const scale = Math.min(1, maxSide / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));

  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { alpha: false })!;
  ctx.drawImage(bmp as any, 0, 0, w, h);

  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', quality));
  const previewUrl = URL.createObjectURL(blob);
  try { (bmp as any).close?.(); } catch {}
  return { previewUrl, ar };
}

async function loadBitmap(fileOrUrl: File | string): Promise<ImageBitmap | HTMLImageElement> {
  if (fileOrUrl instanceof File) {
    const buf = await fileOrUrl.arrayBuffer();
    try {
      return await createImageBitmap(new Blob([buf]));
    } catch {
      const img = new Image();
      img.src = URL.createObjectURL(new Blob([buf]));
      await new Promise((res, rej) => { img.onload = () => res(null); img.onerror = rej; });
      return img;
    }
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = fileOrUrl;
  await new Promise((res, rej) => { img.onload = () => res(null); img.onerror = rej; });
  try { return await createImageBitmap(img); } catch { return img; }
}