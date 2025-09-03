'use client';

import React from 'react';
import { useAlbumStore, ALBUM_FORMATS } from '@/store/useAlbumStore';
import BackgroundPanel from './BackgroundPanel';

export default function Sidebar() {
  const st = useAlbumStore();
  const [collapsed, setCollapsed] = React.useState(false);
  const [exportSpec, setExportSpec] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState<'layout' | 'item' | 'page' | 'export'>('layout');

  // index du format courant (taille OUVERTE)
  const currentFmtIndex = Math.max(
    0,
    ALBUM_FORMATS.findIndex((f) => f.open.w === st.size.w && f.open.h === st.size.h)
  );

  const selectedItem = st.selectedItemId 
    ? st.pages[st.currentPageIndex]?.items.find(i => i.id === st.selectedItemId)
    : null;

  const onChangeFormat = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    const fmt = ALBUM_FORMATS[idx];
    if (!fmt) return;
    st.setSize({ w: fmt.open.w, h: fmt.open.h });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('album:zoom-fit'));
      window.dispatchEvent(new CustomEvent('album:size-changed'));
    }, 0);
  };

  const setPagesCount = (n: number) => {
    const target = Math.max(2, Math.min(25, n));
    st.setPages((prev) => resizePages(prev, target));
    if (st.currentPageIndex > target - 1) st.setCurrentPage(target - 1);
  };

  const onChangeDpi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(72, Math.min(1200, parseInt(e.target.value || '300', 10)));
    st.setDpi(val);
  };

  // Export functions
  function parsePagesSpec(spec: string): number[] {
    const cleaned = spec.replace(/\s+/g, '');
    if (!cleaned) return [];
    const out = new Set<number>();
    for (const token of cleaned.split(',')) {
      if (!token) continue;
      if (token.includes('-')) {
        const [a, b] = token.split('-').map((v) => parseInt(v, 10));
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        const start = Math.max(1, Math.min(a, b));
        const end = Math.min(st.pages.length, Math.max(a, b));
        for (let n = start; n <= end; n++) out.add(n - 1);
      } else {
        const n = parseInt(token, 10);
        if (Number.isFinite(n) && n >= 1 && n <= st.pages.length) out.add(n - 1);
      }
    }
    return [...out].sort((x, y) => x - y);
  }

  if (collapsed) {
    return (
      <aside className="relative z-[1] shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0 overflow-y-auto w-16">
        <div className="py-3 flex items-center justify-center">
          <button
            onClick={() => setCollapsed(false)}
            className="h-8 w-8 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
            title="Déplier"
          >
            ›
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 py-2">
          <button
            onClick={() => { setCollapsed(false); setActiveTab('layout'); }}
            className="h-10 w-10 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center"
            title="Mise en page"
          >
            ⊞
          </button>
          <button
            onClick={() => { setCollapsed(false); setActiveTab('item'); }}
            className="h-10 w-10 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center"
            title="Élément"
          >
            ⊡
          </button>
          <button
            onClick={() => { setCollapsed(false); setActiveTab('page'); }}
            className="h-10 w-10 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center"
            title="Page"
          >
            ⊞
          </button>
          <button
            onClick={() => { setCollapsed(false); setActiveTab('export'); }}
            className="h-10 w-10 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center"
            title="Export"
          >
            ⬇
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative z-[1] shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0 overflow-y-auto"
           style={{ width: 'clamp(320px, 25vw, 400px)', minWidth: 320, maxWidth: 400 }}>
      
      {/* Header avec onglets */}
      <div className="py-3 px-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCollapsed(true)}
            className="h-8 w-8 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
            title="Replier"
          >
            ‹
          </button>
          <div className="text-sm font-semibold text-slate-700">Éditeur d'album</div>
          <div className="text-[12px] text-slate-500 px-2">
            {Math.round(st.zoom * 100)}%
          </div>
        </div>
        
        {/* Onglets */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 rounded-lg p-1">
          {[
            { id: 'layout', label: 'Mise en page', icon: '⊞' },
            { id: 'item', label: 'Élément', icon: '⊡' },
            { id: 'page', label: 'Page', icon: '☐' },
            { id: 'export', label: 'Export', icon: '⬇' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <div className="text-center">
                <div className="text-sm">{tab.icon}</div>
                <div className="text-[10px]">{tab.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 py-4 space-y-6 min-w-0">
        
        {/* Onglet Mise en page */}
        {activeTab === 'layout' && (
          <>
            {/* Format */}
            <section className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Format de l'album</h3>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={currentFmtIndex}
                onChange={onChangeFormat}
              >
                {ALBUM_FORMATS.map((f, i) => (
                  <option key={f.label} value={i}>
                    {f.label} → ouvert {f.open.w}×{f.open.h} cm
                  </option>
                ))}
              </select>
            </section>

            {/* Guides et grille */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Aides visuelles</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={st.showGuides} 
                    onChange={st.toggleGuides}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm">Guides et marges</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={st.showRulers} 
                    onChange={st.toggleRulers}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm">Règles</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={st.showGrid} 
                    onChange={st.toggleGrid}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm">Grille</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={st.snapEnabled} 
                    onChange={st.toggleSnap}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm">Magnétisme</span>
                </label>
              </div>
            </section>

            {/* Marges */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Marges (cm)</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600">Haut</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={st.marginsCm.top}
                    onChange={(e) => st.setMargins({ top: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Bas</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={st.marginsCm.bottom}
                    onChange={(e) => st.setMargins({ bottom: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Gauche</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={st.marginsCm.left}
                    onChange={(e) => st.setMargins({ left: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Droite</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={st.marginsCm.right}
                    onChange={(e) => st.setMargins({ right: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </section>

            
          </>
        )}

        {/* Onglet Élément */}
        {activeTab === 'item' && (
          <>
            {selectedItem ? (
              <>
                {/* Position et taille */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Position et taille</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-600">X (cm)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={selectedItem.x.toFixed(1)}
                        onChange={(e) => st.updateSelected({ x: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Y (cm)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={selectedItem.y.toFixed(1)}
                        onChange={(e) => st.updateSelected({ y: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Largeur (cm)</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.1"
                        value={selectedItem.w.toFixed(1)}
                        onChange={(e) => st.updateSelected({ w: parseFloat(e.target.value) || 0.5 })}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Hauteur (cm)</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.1"
                        value={selectedItem.h.toFixed(1)}
                        onChange={(e) => st.updateSelected({ h: parseFloat(e.target.value) || 0.5 })}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </section>

                {/* Rotation et opacité */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Transformation</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-600">Rotation (°)</label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={selectedItem.rot || 0}
                        onChange={(e) => st.updateSelected({ rot: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-xs text-slate-500 text-center">{selectedItem.rot || 0}°</div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600">Opacité (%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round((selectedItem.opacity || 1) * 100)}
                        onChange={(e) => st.updateSelected({ opacity: parseInt(e.target.value) / 100 })}
                        className="w-full"
                      />
                      <div className="text-xs text-slate-500 text-center">
                        {Math.round((selectedItem.opacity || 1) * 100)}%
                      </div>
                    </div>
                  </div>
                </section>

                {/* Style photo */}
                {selectedItem.kind === 'photo' && (
                  <section>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Style de la photo</h3>
                    <div className="space-y-3">
                      {/* Recadrage */}
                      <div>
                        <label className="text-xs text-slate-600">Zoom interne</label>
                        <input
                          type="range"
                          min="20"
                          max="300"
                          value={Math.round(((selectedItem as any).scale || 1) * 100)}
                          onChange={(e) => st.updateSelected({ scale: parseInt(e.target.value) / 100 } as any)}
                          className="w-full"
                        />
                        <div className="text-xs text-slate-500 text-center">
                          {Math.round(((selectedItem as any).scale || 1) * 100)}%
                        </div>
                      </div>

                      {/* Coins arrondis */}
                      <div>
                        <label className="text-xs text-slate-600">Forme des coins</label>
                        <select
                          value={selectedItem.borderRadiusMode || 'rounded'}
                          onChange={(e) => st.updateSelected({ borderRadiusMode: e.target.value as any })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="rounded">Coins arrondis</option>
                          <option value="circle">Cercle</option>
                          <option value="squircle">Squircle</option>
                        </select>
                      </div>

                      {selectedItem.borderRadiusMode === 'rounded' && (
                        <div>
                          <label className="text-xs text-slate-600">Rayon des coins (%)</label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={selectedItem.borderRadiusPct || 0}
                            onChange={(e) => st.updateSelected({ borderRadiusPct: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <div className="text-xs text-slate-500 text-center">
                            {selectedItem.borderRadiusPct || 0}%
                          </div>
                        </div>
                      )}

                      {/* Ombre */}
                      <div>
                        <label className="text-xs text-slate-600">Ombre portée</label>
                        <select
                          value={selectedItem.shadow || 'none'}
                          onChange={(e) => st.updateSelected({ shadow: e.target.value as any })}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="none">Aucune</option>
                          <option value="soft">Douce</option>
                          <option value="heavy">Prononcée</option>
                        </select>
                      </div>

                      {/* Contour */}
                      <div>
                        <label className="text-xs text-slate-600">Bordure (px)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={selectedItem.strokeWidth || 0}
                            onChange={(e) => st.updateSelected({ strokeWidth: parseInt(e.target.value) || 0 })}
                            className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                          />
                          <input
                            type="color"
                            value={selectedItem.strokeColor || '#000000'}
                            onChange={(e) => st.updateSelected({ strokeColor: e.target.value })}
                            className="w-12 h-8 rounded border border-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Actions sur l'élément */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => st.bringToFront(st.currentPageIndex, selectedItem.id)}
                      className="px-2 py-1.5 text-xs rounded border border-slate-300 hover:bg-slate-50"
                    >
                      Premier plan
                    </button>
                    <button
                      onClick={() => st.sendToBack(st.currentPageIndex, selectedItem.id)}
                      className="px-2 py-1.5 text-xs rounded border border-slate-300 hover:bg-slate-50"
                    >
                      Arrière plan
                    </button>
                    <button
                      onClick={() => st.bringForward(st.currentPageIndex, selectedItem.id)}
                      className="px-2 py-1.5 text-xs rounded border border-slate-300 hover:bg-slate-50"
                    >
                      Avancer
                    </button>
                    <button
                      onClick={() => st.sendBackward(st.currentPageIndex, selectedItem.id)}
                      className="px-2 py-1.5 text-xs rounded border border-slate-300 hover:bg-slate-50"
                    >
                      Reculer
                    </button>
                  </div>
                  <button
                    onClick={() => st.removeSelected()}
                    className="w-full mt-2 px-3 py-2 text-sm rounded border border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Supprimer l'élément
                  </button>
                </section>
              </>
            ) : (
              <div className="text-center text-slate-500 py-8">
                <div className="text-4xl mb-2">⊡</div>
                <p className="text-sm">Sélectionnez un élément pour modifier ses propriétés</p>
              </div>
            )}
          </>
        )}

        {/* Onglet Page */}
        {activeTab === 'page' && (
          <>
            {/* Gestion des pages */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Gestion des pages
              </h3>
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  onClick={() => setPagesCount(st.pages.length - 1)}
                  className="h-8 w-8 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
                  title="Retirer une page"
                >
                  −
                </button>
                <div className="px-3 py-1.5 rounded-full border border-slate-300 text-sm text-slate-700 min-w-[64px] text-center">
                  {st.pages.length}
                </div>
                <button
                  onClick={() => setPagesCount(st.pages.length + 1)}
                  className="h-8 w-8 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
                  title="Ajouter une page"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-slate-600 text-center">
                Page {st.currentPageIndex + 1} / {st.pages.length}
              </p>
            </section>

            {/* Navigation */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Navigation</h3>
              <div className="flex gap-2">
                <button
                  onClick={st.prevPage}
                  disabled={st.currentPageIndex === 0}
                  className="flex-1 px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Précédente
                </button>
                <button
                  onClick={st.nextPage}
                  disabled={st.currentPageIndex === st.pages.length - 1}
                  className="flex-1 px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivante →
                </button>
              </div>
            </section>

            {/* Fond de page */}
            <BackgroundPanel />

            {/* Statistiques de la page */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Statistiques</h3>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Éléments:</span>
                  <span>{st.pages[st.currentPageIndex]?.items.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Photos:</span>
                  <span>
                    {st.pages[st.currentPageIndex]?.items.filter(i => i.kind === 'photo').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Textes:</span>
                  <span>
                    {st.pages[st.currentPageIndex]?.items.filter(i => i.kind === 'text').length || 0}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Onglet Export */}
        {activeTab === 'export' && (
          <>
            {/* Résolution */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Résolution d'export</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={72}
                  max={1200}
                  step={1}
                  className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  value={st.dpi}
                  onChange={onChangeDpi}
                />
                <span className="text-sm text-slate-600">dpi</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                300 dpi recommandé pour l'impression, 150 dpi pour le web.
              </p>
            </section>

            {/* Aperçu des dimensions */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Dimensions d'export</h3>
              <div className="bg-slate-50 rounded-md p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span>{st.size.w}×{st.size.h} cm</span>
                </div>
                <div className="flex justify-between">
                  <span>Pixels:</span>
                  <span>
                    {Math.round((st.size.w / 2.54) * st.dpi)}×{Math.round((st.size.h / 2.54) * st.dpi)} px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taille fichier:</span>
                  <span>≈ {Math.round((st.size.w * st.size.h * st.dpi * st.dpi) / 2540000)} MB</span>
                </div>
              </div>
            </section>

            {/* Options d'export */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Export JPEG</h3>
              <div className="space-y-2">
                <button
                  onClick={() => st.exportJpeg({ pages: [st.currentPageIndex] } as any)}
                  className="w-full px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Exporter la page courante
                </button>
                <button
                  onClick={() => st.exportJpeg({ all: true })}
                  className="w-full px-3 py-2 text-sm rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  Exporter tout l'album
                </button>
              </div>
            </section>

            {/* Export sélectif */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Export personnalisé</h3>
              <div className="space-y-2">
                <input
                  value={exportSpec}
                  onChange={(e) => setExportSpec(e.target.value)}
                  placeholder="Ex: 1-3,5,8"
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  title="Plage de pages à exporter (ex: 1-3,5)"
                />
                <button
                  onClick={() => {
                    const list = parsePagesSpec(exportSpec);
                    if (!list.length) return st.exportJpeg({ pages: [st.currentPageIndex] } as any);
                    st.exportJpeg({ pages: list } as any);
                  }}
                  className="w-full px-3 py-2 text-sm rounded border border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Exporter la sélection
                </button>
                <p className="text-xs text-slate-500">
                  Exemples: "1,3,5" ou "2-8" ou "1-3,7,9-12"
                </p>
              </div>
            </section>

            {/* Historique et annulation */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Historique</h3>
              <div className="flex gap-2">
                <button
                  onClick={st.undo}
                  disabled={st.historyIndex <= 0}
                  className="flex-1 px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Annuler la dernière action"
                >
                  ↶ Annuler
                </button>
                <button
                  onClick={st.redo}
                  disabled={st.historyIndex >= st.history.length - 1}
                  className="flex-1 px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refaire l'action suivante"
                >
                  ↷ Refaire
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1 text-center">
                {st.history.length > 0 ? `${st.historyIndex + 1}/${st.history.length}` : 'Aucun historique'}
              </p>
            </section>

            {/* Aperçu général */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Aperçu de l'album</h3>
              <button
                onClick={st.openPreview}
                className="w-full px-3 py-2 text-sm rounded border border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                Ouvrir l'aperçu plein écran
              </button>
            </section>

            {/* Raccourcis clavier */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Raccourcis clavier</h3>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Supprimer élément:</span>
                  <kbd className="px-1 py-0.5 bg-slate-100 rounded">Del</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Zoom image:</span>
                  <kbd className="px-1 py-0.5 bg-slate-100 rounded">Alt + molette</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Pan (déplacer vue):</span>
                  <kbd className="px-1 py-0.5 bg-slate-100 rounded">Espace + glisser</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Zoom global:</span>
                  <kbd className="px-1 py-0.5 bg-slate-100 rounded">Cmd + molette</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Reset zoom photo:</span>
                  <kbd className="px-1 py-0.5 bg-slate-100 rounded">Cmd + 0</kbd>
                </div>
              </div>
            </section>

            {/* Informations techniques */}
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Informations</h3>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Assets importés:</span>
                  <span>{st.assets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Éléments totaux:</span>
                  <span>
                    {st.pages.reduce((total, page) => total + page.items.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Zoom actuel:</span>
                  <span>{Math.round(st.zoom * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Pan X/Y:</span>
                  <span>{Math.round(st.panPx.x)}, {Math.round(st.panPx.y)}</span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Actions rapides globales */}
        <section className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (confirm('Réinitialiser le zoom et le pan ?')) {
                  st.setZoom(1);
                  st.resetPan();
                }
              }}
              className="px-2 py-1.5 text-xs rounded border border-slate-300 hover:bg-slate-50"
            >
              Reset vue
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('album:zoom-fit'))}
              className="px-2 py-1.5 text-xs rounded border border-slate-300 hover:bg-slate-50"
            >
              Ajuster zoom
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}

/* -------- Helpers -------- */
import type { Page } from '@/store/useAlbumStore';

function resizePages(prev: Page[], targetCount: number): Page[] {
  const cur = [...prev].sort((a, b) => a.index - b.index);
  if (targetCount === cur.length) return cur.map((p, i) => ({ ...p, index: i }));
  if (targetCount < cur.length) return cur.slice(0, targetCount).map((p, i) => ({ ...p, index: i }));

  const toAdd = targetCount - cur.length;
  const base = cur.length;
  const added: Page[] = Array.from({ length: toAdd }, (_, k) => ({
    id: `p${base + k}`,
    index: base + k,
    items: [],
    background: {
      kind: 'none',
      solid: { color: '#FFFFFF' },
      linear: { from: '#FFFFFF', to: '#F8FAFC', angle: 90 },
      radial: { inner: '#FFFFFF', outer: '#F1F5F9', shape: 'ellipse' },
      image: { fit: 'cover', opacity: 1, scale: 1, offsetX: 0, offsetY: 0 },
      vignette: { enabled: false, strength: 0.25 },
      texture: { type: 'none', opacity: 0.3 },
      noise: { enabled: false, amount: 0.15, opacity: 0.15, monochrome: true },
      text: { content: '', color: '#000000', opacity: 0.08, sizePct: 40, rotation: -20, font: 'serif' },
    },
  }));
  return cur.concat(added).map((p, i) => ({ ...p, index: i }));
}