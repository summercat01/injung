import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '인정협회',
    short_name: '인정협회',
    description: '주장을 올리고 인정받아보세요. 인정 or 노인정?',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff8f4',
    theme_color: '#ac3323',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
