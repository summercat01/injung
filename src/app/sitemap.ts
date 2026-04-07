import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://injung.semo3.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://injung.semo3.com/feed', lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: 'https://injung.semo3.com/onboarding', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
