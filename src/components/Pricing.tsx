'use client';

import * as React from 'react';

type CreditPackKey = 'none' | 'p10' | 'p25' | 'p50';

const PACKS: Record<
  CreditPackKey,
  { label: string; albums: number; price: number; unit?: string }
> = {
  none: { label: 'Sans pack', albums: 0, price: 0 },
  p10:  { label: 'Pack 10 albums', albums: 10, price: 40, unit: '4€ / album' },
  p25:  { label: 'Pack 25 albums', albums: 25, price: 87, unit: '3,5€ / album' },
  p50:  { label: 'Pack 50 albums', albums: 50, price: 150, unit: '3€ / album' },
};

const SUBSCRIPTION_PRICE = 29; // € / mois
const INCLUDED_MONTHLY_CREDITS = 10; // ex: 10 albums inclus / mois

export default function Pricing() {
  const [selectedPack, setSelectedPack] = React.useState<CreditPackKey>('none');

  const pack = PACKS[selectedPack];
  const total = SUBSCRIPTION_PRICE + pack.price;

  // TODO Stripe: remplace par un appel à ton endpoint /api/checkout
  const onSubscribe = () => {
    // Exemple de payload à envoyer à ton backend
    const payload = {
      plan: 'monthly_29',
      addOnPack: selectedPack === 'none' ? null : {
        code: selectedPack,
        albums: pack.albums,
        price: pack.price,
      },
    };
    console.log('Checkout payload →', payload);
    alert(
      `Simu checkout:\n- Abonnement: 29€/mois (+${INCLUDED_MONTHLY_CREDITS} albums)\n- Pack: ${pack.label} (${pack.price}€)\n- Total à payer maintenant: ${total}€`
    );
  };

  const PackRow: React.FC<{ k: CreditPackKey }> = ({ k }) => {
    const p = PACKS[k];
    const selected = selectedPack === k;
    return (
      <label
        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border cursor-pointer transition
          ${selected ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
      >
        <div className="flex items-center gap-3">
          <input
            type="radio"
            name="credit-pack"
            checked={selected}
            onChange={() => setSelectedPack(k)}
            className="accent-sky-600"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900">{p.label}</span>
            {p.unit && <span className="text-xs text-slate-500">{p.unit}</span>}
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-900">{p.price}€</div>
      </label>
    );
  };

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center">
          Des tarifs simples, avec crédits à la carte
        </h2>
        <p className="mt-3 text-center text-gray-600">
          Abonne-toi à 29€/mois (avec {INCLUDED_MONTHLY_CREDITS} albums inclus) et ajoute un pack de crédits si besoin.
        </p>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Carte Abonnement + choix pack à côté (sur desktop, c’est la carte “mise en avant”) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 text-xs font-medium">
                      Le plus populaire
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">
                      Abonnement mensuel
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      29€ / mois — {INCLUDED_MONTHLY_CREDITS} albums inclus chaque mois
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900">29€</div>
                    <div className="text-xs text-slate-500">/mois TTC</div>
                  </div>
                </div>

                {/* Choix du pack juste “à côté” (dans la même carte) */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-slate-900 mb-2">
                    Ajouter des crédits d’albums (optionnel)
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-2">
                    <PackRow k="none" />
                    <PackRow k="p10" />
                    <PackRow k="p25" />
                    <PackRow k="p50" />
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Abonnement</span>
                      <span className="font-medium text-slate-900">29€ / mois</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-slate-600">Pack sélectionné</span>
                      <span className="font-medium text-slate-900">
                        {pack.label} {pack.price > 0 ? `• ${pack.price}€` : '• 0€'}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200 my-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-medium">Total aujourd’hui</span>
                      <span className="text-lg font-bold text-slate-900">{total}€</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Le pack est payé une seule fois aujourd’hui. L’abonnement se renouvellera à 29€/mois (annulable à tout moment).
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={onSubscribe}
                      className="inline-flex justify-center items-center h-11 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                    >
                      Continuer
                    </button>
                    <p className="text-xs text-slate-500">
                      Export 1 album = 1 crédit. Les crédits de pack **s’additionnent** à tes crédits inclus.
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  <li>• Accès complet à l’éditeur</li>
                  <li>• {INCLUDED_MONTHLY_CREDITS} albums / mois inclus</li>
                  <li>• Achat de packs à la carte</li>
                  <li>• Annulable à tout moment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Carte “Packs seuls” — pour les gens qui veulent juste recharger plus tard */}
          <div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-slate-900">
                Packs seuls (sans engagement)
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Tu peux aussi racheter des crédits à tout moment.
              </p>

              <div className="mt-5 space-y-3">
                {(['p10','p25','p50'] as CreditPackKey[]).map((k) => {
                  const p = PACKS[k];
                  return (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900">{p.label}</div>
                        <div className="text-xs text-slate-500">{p.unit}</div>
                      </div>
                      <button
                        className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[13px] font-medium"
                        onClick={() => {
                          // TODO Stripe: lancer un checkout one-shot pour ce pack
                          console.log('Buy pack only →', p);
                          alert(`Simu achat ${p.label} — ${p.price}€`);
                        }}
                      >
                        {p.price}€
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Les packs n’expirent pas. Ils s’ajoutent à tes crédits existants.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}