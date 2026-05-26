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
  webpack(config) {
    config.module.rules.push({
      test: /\.mp3$/,
      type: 'asset/resource',
    });
    return config;
  },
};

export default nextConfig;
