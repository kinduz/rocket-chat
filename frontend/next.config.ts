import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rocket-chatt.storage.yandexcloud.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
