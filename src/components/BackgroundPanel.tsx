'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function BackgroundPanel() {
  const st = useAlbumStore();
  const page = st.pages[st.currentPageIndex];
  if (!page) return null;

  const bg = page.background;

  const setBg = (patch: Parameters<typeof st.setPageBackground>[1]) =>
    st.setPageBackground(st.currentPageIndex, patch);
  const setTxt = (patch: Parameters<typeof st.setBackgroundText>[1]) =>
    st.setBackgroundText(st.currentPageIndex, patch);
  const setImg = (patch: Parameters<typeof st.setBackgroundImage>[1]) =>
    st.setBackgroundImage(st.currentPageIndex, patch);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Fond de page</h3>

      {/* Mode */}
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-600">Mode</label>
        <select
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          value={bg.kind}
          onChange={(e) => setBg({ kind: e.target.value as any })}
        >
          <option value="none">Aucun</option>
          <option value="solid">Uni</option>
          <option value="linear">Dégradé linéaire</option>
          <option value="radial">Dégradé radial</option>
          <option value="image">Image</option>
          <option value="text">Texte de fond</option>
        </select>
      </div>

      {/* Uni */}
      {bg.kind === 'solid' && (
        <Row label="Couleur">
          <input
            type="color"
            value={bg.solid?.color ?? '#FFFFFF'}
            onChange={(e) => setBg({ solid: { color: e.target.value } })}
            className="h-9 w-full rounded-md border border-slate-300"
          />
        </Row>
      )}

      {/* Linear */}
      {bg.kind === 'linear' && (
        <div className="space-y-2">
          <Row label="De">
            <input
              type="color"
              value={bg.linear?.from ?? '#FFFFFF'}
              onChange={(e) => setBg({ linear: { ...(bg.linear ?? { angle: 90, to: '#F8FAFC' }), from: e.target.value } })}
              className="h-9 w-full rounded-md border border-slate-300"
            />
          </Row>
          <Row label="À">
            <input
              type="color"
              value={bg.linear?.to ?? '#F8FAFC'}
              onChange={(e) => setBg({ linear: { ...(bg.linear ?? { angle: 90, from: '#FFFFFF' }), to: e.target.value } })}
              className="h-9 w-full rounded-md border border-slate-300"
            />
          </Row>
          <Row label="Angle">
            <input
  type="number"
  value={bg.linear?.angle ?? 90}
  onChange={(e) => {
    const angle = parseInt(e.target.value || '0', 10);
    setBg({
      linear: {
        from: bg.linear?.from ?? '#FFFFFF',
        to: bg.linear?.to ?? '#F8FAFC',
        angle,
      },
    });
  }}
  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
/>
          </Row>
        </div>
      )}

      {/* Radial */}
      {bg.kind === 'radial' && (
        <div className="space-y-2">
          <Row label="Centre">
            <input
              type="color"
              value={bg.radial?.inner ?? '#FFFFFF'}
              onChange={(e) => setBg({ radial: { ...(bg.radial ?? { outer: '#F1F5F9', shape: 'ellipse' }), inner: e.target.value } })}
              className="h-9 w-full rounded-md border border-slate-300"
            />
          </Row>
          <Row label="Bords">
            <input
              type="color"
              value={bg.radial?.outer ?? '#F1F5F9'}
              onChange={(e) => setBg({ radial: { ...(bg.radial ?? { inner: '#FFFFFF', shape: 'ellipse' }), outer: e.target.value } })}
              className="h-9 w-full rounded-md border border-slate-300"
            />
          </Row>
          <Row label="Forme">
            <select
              value={bg.radial?.shape ?? 'ellipse'}
              onChange={(e) => setBg({ radial: { ...(bg.radial ?? {}), shape: e.target.value as any } })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="ellipse">Ellipse</option>
              <option value="circle">Cercle</option>
            </select>
          </Row>
        </div>
      )}

      {/* Image */}
      {bg.kind === 'image' && (
        <div className="space-y-2">
          <Row label="Depuis vos photos">
            <select
              value={bg.image?.assetId ?? ''}
              onChange={(e) => setImg({ assetId: e.target.value || undefined })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">(Aucune)</option>
              {st.assets.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
            </select>
          </Row>
          <Row label="ou URL">
            <input
              type="url"
              placeholder="https://…"
              value={bg.image?.url ?? ''}
              onChange={(e) => setImg({ url: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </Row>
          <Row label="Ajustement">
            <select
              value={bg.image?.fit ?? 'cover'}
              onChange={(e) => setImg({ fit: e.target.value as any })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="cover">Couverture</option>
              <option value="contain">Contenir</option>
            </select>
          </Row>
          <Row label="Opacité">
            <input
              type="range" min={0} max={1} step={0.01}
              value={bg.image?.opacity ?? 1}
              onChange={(e) => setImg({ opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </Row>
          <Row label="Échelle">
            <input
              type="number" step={0.05}
              value={bg.image?.scale ?? 1}
              onChange={(e) => setImg({ scale: parseFloat(e.target.value || '1') })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </Row>
          <Row label="Décalage X%">
            <input
              type="number"
              value={bg.image?.offsetX ?? 0}
              onChange={(e) => setImg({ offsetX: parseInt(e.target.value || '0', 10) })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </Row>
          <Row label="Décalage Y%">
            <input
              type="number"
              value={bg.image?.offsetY ?? 0}
              onChange={(e) => setImg({ offsetY: parseInt(e.target.value || '0', 10) })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </Row>
        </div>
      )}

      {/* Texte de fond */}
      {bg.kind === 'text' && (
        <div className="space-y-2">
          <Row label="Texte">
            <input
              type="text"
              value={bg.text?.content ?? ''}
              onChange={(e) => setTxt({ content: e.target.value })}
              placeholder="Ex: Mariage de Léa & Hugo"
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </Row>
          <Row label="Couleur">
            <input
  type="color"
  value={bg.linear?.from ?? '#FFFFFF'}
  onChange={(e) =>
    setBg({
      linear: {
        from: e.target.value,
        to: bg.linear?.to ?? '#F8FAFC',
        angle: bg.linear?.angle ?? 90,
      },
    })
  }
/>
          </Row>
          <Row label="% largeur">
            <input
              type="number" min={5} max={200}
              value={bg.text?.sizePct ?? 40}
              onChange={(e) => setTxt({ sizePct: Math.max(5, Math.min(200, parseInt(e.target.value || '40', 10))) })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </Row>
          <Row label="Rotation">
            <input
              type="number"
              value={bg.text?.rotation ?? -20}
              onChange={(e) => setTxt({ rotation: parseInt(e.target.value || '0', 10) })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </Row>
          <Row label="Opacité">
            <input
              type="range" min={0} max={1} step={0.01}
              value={bg.text?.opacity ?? 0.08}
              onChange={(e) => setTxt({ opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </Row>
          <Row label="Police">
            <select
              value={bg.text?.font ?? 'serif'}
              onChange={(e) => setTxt({ font: e.target.value })}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="serif">Serif</option>
              <option value="sans-serif">Sans-serif</option>
              <option value="monospace">Monospace</option>
              <option value="cursive">Cursive</option>
            </select>
          </Row>
        </div>
      )}

      {/* Vignette */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700">Fondu (vignette)</span>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!bg.vignette?.enabled}
              onChange={(e) => setBg({ vignette: { enabled: e.target.checked, strength: bg.vignette?.strength ?? 0.25 } })}
            />
            Activer
          </label>
        </div>
        <Row label="Intensité">
          <input
            type="range" min={0} max={1} step={0.01}
            disabled={!bg.vignette?.enabled}
            value={bg.vignette?.strength ?? 0.25}
            onChange={(e) => setBg({ vignette: { enabled: true, strength: parseFloat(e.target.value) } })}
            className="w-full"
          />
        </Row>
      </div>

      {/* Texture */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <h4 className="text-sm font-medium text-slate-700">Texture</h4>
        <Row label="Type">
          <select
            value={bg.texture?.type ?? 'none'}
            onChange={(e) => setBg({ texture: { ...(bg.texture ?? { opacity: 0.3 }), type: e.target.value as any } })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="none">Aucune</option>
            <option value="paper">Papier</option>
            <option value="linen">Lin</option>
            <option value="grid">Grille</option>
          </select>
        </Row>
        <Row label="Opacité">
          <input
            type="range" min={0} max={1} step={0.01}
            value={bg.texture?.opacity ?? 0.3}
            onChange={(e) => setBg({ texture: { ...(bg.texture ?? { type: 'paper' }), opacity: parseFloat(e.target.value) } })}
            className="w-full"
          />
        </Row>
      </div>

      {/* Bruit */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700">Bruit (grain)</h4>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!bg.noise?.enabled}
              onChange={(e) => setBg({ noise: { enabled: e.target.checked, amount: bg.noise?.amount ?? 0.15, opacity: bg.noise?.opacity ?? 0.15, monochrome: bg.noise?.monochrome ?? true } })}
            />
            Activer
          </label>
        </div>
        <Row label="Quantité">
          <input
            type="range" min={0} max={1} step={0.01}
            disabled={!bg.noise?.enabled}
            value={bg.noise?.amount ?? 0.15}
            onChange={(e) => setBg({ noise: { ...(bg.noise ?? { enabled: true, opacity: 0.15, monochrome: true }), amount: parseFloat(e.target.value) } })}
            className="w-full"
          />
        </Row>
        <Row label="Opacité">
          <input
            type="range" min={0} max={1} step={0.01}
            disabled={!bg.noise?.enabled}
            value={bg.noise?.opacity ?? 0.15}
            onChange={(e) => setBg({ noise: { ...(bg.noise ?? { enabled: true, amount: 0.15, monochrome: true }), opacity: parseFloat(e.target.value) } })}
            className="w-full"
          />
        </Row>
        <Row label="Mono">
          <input
            type="checkbox"
            disabled={!bg.noise?.enabled}
            checked={bg.noise?.monochrome ?? true}
            onChange={(e) => setBg({ noise: { ...(bg.noise ?? { enabled: true, amount: 0.15, opacity: 0.15 }), monochrome: e.target.checked } })}
          />
        </Row>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 items-center">
      <label className="text-xs text-slate-600">{label}</label>
      <div>{children}</div>
    </div>
  );
}