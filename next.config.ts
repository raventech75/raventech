import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Redirige l'apex vers www via le header Host
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'raventech.fr' }],
        destination: 'https://www.raventech.fr/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;