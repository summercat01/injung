import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import Providers from '@/components/Providers';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: '인정협회',
  description: '주장을 올리고 인정받아보세요. 인정 or 노인정?',
  metadataBase: new URL('https://injung.semo3.com'),
  icons: {
    icon: '/icon-512.png',
    apple: '/icon-512.png',
  },
  openGraph: {
    title: '인정협회',
    description: '주장을 올리고 인정받아보세요. 인정 or 노인정?',
    url: 'https://injung.semo3.com',
    siteName: '인정협회',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '인정협회',
    description: '주장을 올리고 인정받아보세요. 인정 or 노인정?',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-TX3X3J2BXW" strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-TX3X3J2BXW');
      `}</Script>
      <body>
        <Providers>
          <TopBar />
          <div className="min-h-screen pb-20 pt-16">{children}</div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
