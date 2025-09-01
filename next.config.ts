import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Important pour éviter que Turbopack tente de bundler le mauvais build
  transpilePackages: ['konva', 'react-konva'],

  webpack: (config, { isServer }) => {
    // 1) Empêche toute tentative de charger le module 'canvas'
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false,

      // 2) Force Konva à utiliser son entrée navigateur (et pas index-node)
      'konva/lib/index-node': 'konva/lib/index',
      'konva/lib/index-node.js': 'konva/lib/index.js',
    };

    return config;
  },

  // (Optionnel) Si tu sers des images externes
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },

  // Si tu avais des redirects/rewrite invalides, commente-les le temps du build
  // async redirects() {
  //   return [
  //     // Ex. incorrect : "https://domain" → il faut des chemins relatifs uniquement ici
  //   ];
  // },
};

export default nextConfig;