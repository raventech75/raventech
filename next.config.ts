// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Si tu utilises les images distantes (Supabase storage, CDN, etc.)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      // Ajoute ci-dessous les domaines précis si tu veux resserrer la sécurité :
      // { protocol: 'https', hostname: '*.supabase.co' },
      // { protocol: 'https', hostname: 'your-cdn.example.com' },
    ],
    // Mets à true si tu ne veux aucune optimisation Next sur les <Image />
    // unoptimized: true,
  },

  // Laisse les checks actifs (mets à true si tu veux build même avec erreurs)
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // Patch Konva: empêche l’import du module "canvas" (Node) côté client
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Important: empêche Konva de charger la version node
      canvas: false,
      // Ces alias aident Konva à cibler ses builds browser
      'konva/lib/Canvas': 'konva/lib/Canvas.js',
      'konva/lib/Context': 'konva/lib/Context.js',
      'konva/lib/Util': 'konva/lib/Util.js',
    };
    return config;
  },

  // Si tu as plusieurs lockfiles à la racine du workspace et que Turbopack
  // se trompe de racine, dé-commente et adapte ce root :
  // turbopack: {
  //   root: __dirname, // ou le chemin exact de ton app Next
  // },

  // Exemple de redirections (laisse commenté si tu n’en as pas besoin)
  // async redirects() {
  //   return [
  //     {
  //       source: '/old-path',
  //       destination: '/new-path',
  //       permanent: true,
  //     },
  //   ];
  // },
};

export default nextConfig;