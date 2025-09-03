'use client';

import React from 'react';
import { useAlbumStore } from '@/store/useAlbumStore';

export default function BackgroundPanel() {
  const st = useAlbumStore();
  const page = st.pages[st.currentPageIndex];
  const bg = page?.background;

  if (!bg) return null;

  const updateBg = (patch: any) => {
    st.setPageBackground(st.currentPageIndex, patch);
  };

  const updateBgText = (patch: any) => {
    st.setBackgroundText(st.currentPageIndex, patch);
  };

  const updateBgImage = (patch: any) => {
    st.setBackgroundImage(st.currentPageIndex, patch);
  };

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Arrière-plan de la page</h3>
      
      {/* Type de fond */}
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-600 mb-2 block">Type d'arrière-plan</label>
        <select
          value={bg.kind}
          onChange={(e) => updateBg({ kind: e.target.value })}
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="none">Aucun</option>
          <option value="solid">Couleur unie</option>
          <option value="linear">Dégradé linéaire</option>
          <option value="radial">Dégradé radial</option>
          <option value="image">Image</option>
          <option value="text">Texte en filigrane</option>
        </select>
      </div>

      {/* Couleur unie */}
      {bg.kind === 'solid' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Couleur</label>
            <input
              type="color"
              value={bg.solid?.color || '#FFFFFF'}
              onChange={(e) => updateBg({ solid: { color: e.target.value } })}
              className="w-full h-10 rounded border border-slate-300"
            />
          </div>
        </div>
      )}

      {/* Dégradé linéaire */}
      {bg.kind === 'linear' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Couleur début</label>
              <input
                type="color"
                value={bg.linear?.from || '#FFFFFF'}
                onChange={(e) => updateBg({ 
                  linear: { ...bg.linear, from: e.target.value } 
                })}
                className="w-full h-8 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Couleur fin</label>
              <input
                type="color"
                value={bg.linear?.to || '#F8FAFC'}
                onChange={(e) => updateBg({ 
                  linear: { ...bg.linear, to: e.target.value } 
                })}
                className="w-full h-8 rounded border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Angle: {bg.linear?.angle || 90}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={bg.linear?.angle || 90}
              onChange={(e) => updateBg({ 
                linear: { ...bg.linear, angle: parseInt(e.target.value) } 
              })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Dégradé radial */}
      {bg.kind === 'radial' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Couleur centre</label>
              <input
                type="color"
                value={bg.radial?.inner || '#FFFFFF'}
                onChange={(e) => updateBg({ 
                  radial: { ...bg.radial, inner: e.target.value } 
                })}
                className="w-full h-8 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Couleur bord</label>
              <input
                type="color"
                value={bg.radial?.outer || '#F1F5F9'}
                onChange={(e) => updateBg({ 
                  radial: { ...bg.radial, outer: e.target.value } 
                })}
                className="w-full h-8 rounded border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Forme</label>
            <select
              value={bg.radial?.shape || 'ellipse'}
              onChange={(e) => updateBg({ 
                radial: { ...bg.radial, shape: e.target.value } 
              })}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="ellipse">Ellipse</option>
              <option value="circle">Cercle</option>
            </select>
          </div>
        </div>
      )}

      {/* Image */}
      {bg.kind === 'image' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Source image</label>
            <select
              value={bg.image?.assetId || ''}
              onChange={(e) => {
                const asset = st.assets.find(a => a.id === e.target.value);
                updateBgImage({ 
                  assetId: e.target.value || undefined,
                  url: asset?.url || undefined 
                });
              }}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Choisir une image...</option>
              {st.assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  Image {asset.id.slice(0, 8)}...
                </option>
              ))}
            </select>
          </div>
          
          {(bg.image?.assetId || bg.image?.url) && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Ajustement</label>
                <select
                  value={bg.image?.fit || 'cover'}
                  onChange={(e) => updateBgImage({ fit: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="cover">Couvrir (crop)</option>
                  <option value="contain">Contenir (fit)</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Échelle: {Math.round((bg.image?.scale || 1) * 100)}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="300"
                  value={(bg.image?.scale || 1) * 100}
                  onChange={(e) => updateBgImage({ scale: parseInt(e.target.value) / 100 })}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Décalage X: {bg.image?.offsetX || 0}%
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={bg.image?.offsetX || 0}
                    onChange={(e) => updateBgImage({ offsetX: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Décalage Y: {bg.image?.offsetY || 0}%
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={bg.image?.offsetY || 0}
                    onChange={(e) => updateBgImage({ offsetY: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Opacité: {Math.round((bg.image?.opacity || 1) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(bg.image?.opacity || 1) * 100}
                  onChange={(e) => updateBgImage({ opacity: parseInt(e.target.value) / 100 })}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Texte en filigrane */}
      {bg.kind === 'text' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Texte</label>
            <textarea
              value={bg.text?.content || ''}
              onChange={(e) => updateBgText({ content: e.target.value })}
              placeholder="Mon Album Photo"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm resize-none"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Couleur</label>
              <input
                type="color"
                value={bg.text?.color || '#000000'}
                onChange={(e) => updateBgText({ color: e.target.value })}
                className="w-full h-8 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Police</label>
              <select
                value={bg.text?.font || 'serif'}
                onChange={(e) => updateBgText({ font: e.target.value })}
                className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans Serif</option>
                <option value="monospace">Monospace</option>
                <option value="cursive">Cursive</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Taille: {bg.text?.sizePct || 40}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={bg.text?.sizePct || 40}
              onChange={(e) => updateBgText({ sizePct: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Rotation: {bg.text?.rotation || -20}°
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              value={bg.text?.rotation || -20}
              onChange={(e) => updateBgText({ rotation: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Opacité: {Math.round((bg.text?.opacity || 0.08) * 100)}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={(bg.text?.opacity || 0.08) * 100}
              onChange={(e) => updateBgText({ opacity: parseInt(e.target.value) / 100 })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Effets additionnels */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <h4 className="text-xs font-semibold text-slate-700 mb-3">Effets additionnels</h4>
        
        {/* Texture */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Texture</label>
            <select
              value={bg.texture?.type || 'none'}
              onChange={(e) => updateBg({ 
                texture: { ...bg.texture, type: e.target.value } 
              })}
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="none">Aucune</option>
              <option value="paper">Papier</option>
              <option value="linen">Lin</option>
              <option value="grid">Grille</option>
            </select>
          </div>
          
          {bg.texture?.type !== 'none' && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Intensité texture: {Math.round((bg.texture?.opacity || 0.3) * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={(bg.texture?.opacity || 0.3) * 100}
                onChange={(e) => updateBg({ 
                  texture: { ...bg.texture, opacity: parseInt(e.target.value) / 100 } 
                })}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Vignettage */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={bg.vignette?.enabled || false}
              onChange={(e) => updateBg({ 
                vignette: { ...bg.vignette, enabled: e.target.checked } 
              })}
              className="rounded border-slate-300"
            />
            <span className="text-xs font-medium text-slate-600">Vignettage</span>
          </label>
          
          {bg.vignette?.enabled && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Intensité: {Math.round((bg.vignette?.strength || 0.25) * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={(bg.vignette?.strength || 0.25) * 100}
                onChange={(e) => updateBg({ 
                  vignette: { ...bg.vignette, strength: parseInt(e.target.value) / 100 } 
                })}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Bruit/Grain */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={bg.noise?.enabled || false}
              onChange={(e) => updateBg({ 
                noise: { ...bg.noise, enabled: e.target.checked } 
              })}
              className="rounded border-slate-300"
            />
            <span className="text-xs font-medium text-slate-600">Grain photo</span>
          </label>
          
          {bg.noise?.enabled && (
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Quantité: {Math.round((bg.noise?.amount || 0.15) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(bg.noise?.amount || 0.15) * 100}
                  onChange={(e) => updateBg({ 
                    noise: { ...bg.noise, amount: parseInt(e.target.value) / 100 } 
                  })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Opacité: {Math.round((bg.noise?.opacity || 0.15) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(bg.noise?.opacity || 0.15) * 100}
                  onChange={(e) => updateBg({ 
                    noise: { ...bg.noise, opacity: parseInt(e.target.value) / 100 } 
                  })}
                  className="w-full"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bg.noise?.monochrome || true}
                  onChange={(e) => updateBg({ 
                    noise: { ...bg.noise, monochrome: e.target.checked } 
                  })}
                  className="rounded border-slate-300"
                />
                <span className="text-xs text-slate-600">Monochrome</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Aperçu */}
      <div className="mt-4 p-3 bg-slate-50 rounded-md">
        <div className="text-xs font-medium text-slate-600 mb-2">Aperçu</div>
        <div 
          className="w-full h-16 rounded border border-slate-200"
          style={{
            background: (() => {
              if (bg.kind === 'solid') return bg.solid?.color || '#FFFFFF';
              if (bg.kind === 'linear') return `linear-gradient(${bg.linear?.angle || 90}deg, ${bg.linear?.from || '#FFFFFF'}, ${bg.linear?.to || '#F8FAFC'})`;
              if (bg.kind === 'radial') return `radial-gradient(${bg.radial?.shape || 'ellipse'}, ${bg.radial?.inner || '#FFFFFF'}, ${bg.radial?.outer || '#F1F5F9'})`;
              return '#FFFFFF';
            })()
          }}
        >
          {bg.kind === 'text' && bg.text?.content && (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{
                color: bg.text.color,
                opacity: bg.text.opacity,
                transform: `rotate(${bg.text.rotation}deg)`,
                fontSize: '10px',
                fontFamily: bg.text.font
              }}
            >
              {bg.text.content}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}