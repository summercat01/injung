import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from OAuth providers
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
    ],
  },
};

export default nextConfig;
