import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import Providers from '@/components/Providers';
import TopBar from '@/components/TopBar';

export const metadata: Metadata = {
  title: '인정협회',
  description: '주장을 올리고 인정받아보세요. 인정 or 노인정?',
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
